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
                    
                    // Try to pull latest image to cache layers
                    sh "docker pull ${latestImageName} || true"
                    
                    echo "Building image..."
                    sh "docker build -t ${fullImageName} ."
                    sh "docker tag ${fullImageName} ${latestImageName}"
                        
                    echo "Pushing images..."
                    sh "docker push ${fullImageName}"
                    sh "docker push ${latestImageName}"
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                     // Ensure we have the latest image
                     sh "docker pull ${REGISTRY}/${IMAGE_REPO}:latest"

                     // Deploy using docker-compose
                     // This handles stopping, recreating, and starting the container if the image changed
                     sh "docker-compose up -d"
                     
                     // Cleanup unused images to save space
                     sh "docker image prune -f || true"
                }
            }
        }
    }
}
