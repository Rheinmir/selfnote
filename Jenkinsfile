pipeline {
    agent { label 'dockerlinux' }
    
    environment {
        REGISTRY = 'ghcr.io'
        // Change to your actual repository
        IMAGE_REPO = 'rheinmir/memos'
        CONTAINER_NAME = 'memos-server'
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Pull Source') {
            steps {
                sh 'git status'
            }
        }
        
        stage('Login to GHCR') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-registry-auth', passwordVariable: 'GH_TOKEN', usernameVariable: 'GH_USER')]) {
                    sh 'docker login ghcr.io -u "$GH_USER" -p "$GH_TOKEN"'
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    def gitCommit = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    def fullImageName = "${REGISTRY}/${IMAGE_REPO}:${gitCommit}"
                    def latestImageName = "${REGISTRY}/${IMAGE_REPO}:latest"
                    
                    echo "Checking remote image: ${fullImageName}"
                    
                    // Try to pull the image first to see if it exists remotely
                    // We use '|| true' so the pipeline doesn't fail if pull fails (image doesn't exist)
                    def pullExitCode = sh(script: "docker pull ${fullImageName}", returnStatus: true)
                    
                    if (pullExitCode == 0) {
                         echo "Image ${fullImageName} exists remotely. Skipping build."
                         // Ensure we tag this existing image as latest so Deploy stage works if it relies on latest
                         sh "docker tag ${fullImageName} ${latestImageName}"
                         sh "docker push ${latestImageName}"
                    } else {
                        echo "Image not found remotely. Building..."
                        
                        // Try to pull latest image to cache layers for faster build
                        sh "docker pull ${latestImageName} || true"
                        
                        sh "docker build -t ${fullImageName} ."
                        sh "docker tag ${fullImageName} ${latestImageName}"
                        
                        echo "Pushing images..."
                        sh "docker push ${fullImageName}"
                        sh "docker push ${latestImageName}"
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                     // Ensure we have the latest image
                     sh "docker pull ${REGISTRY}/${IMAGE_REPO}:latest"

                     // Deploy using plain docker run since the agent container environment 
                     // doesn't support docker compose plugin or binary correctly.
                     
                     // Stop and remove existing container
                     sh "docker stop ${CONTAINER_NAME} || true"
                     sh "docker rm ${CONTAINER_NAME} || true"
                     
                     // Get current directory for volume mapping
                     def workspace = sh(script: "pwd", returnStdout: true).trim()

                     // Run the container
                     // Note: We use the volume mapping relative to the current workspace. 
                     // If running in a containerized agent, ensure the host path maps correctly.
                     sh """
                     docker run -d \\
                       --name ${CONTAINER_NAME} \\
                       --restart unless-stopped \\
                       -p 5230:5230 \\
                       -v "${workspace}/memos-data:/var/opt/memos" \\
                       -e MEMOS_DRIVER=sqlite \\
                       -e MEMOS_Log_Level=info \\
                       ${REGISTRY}/${IMAGE_REPO}:latest
                     """
                     
                     // Cleanup unused images to save space
                     sh "docker image prune -f || true"
                }
            }
        }
    }
}
