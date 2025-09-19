# Deployment Script for GramAarogya Multilingual Chatbot
# Automates deployment to various cloud platforms

#!/bin/bash

# =============================================================================
# Configuration
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="gramarogya-chatbot"
DOCKER_IMAGE_NAME="gramarogya/multilingual-chatbot"
VERSION=${1:-"latest"}

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

validate_environment() {
    log_info "Validating environment configuration..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Copying from .env.example"
        cp .env.example .env
        log_warning "Please update .env file with your actual configuration"
        return 1
    fi
    
    # Check required environment variables
    source .env
    
    required_vars=(
        "TEAM_API_KEY"
        "GOOGLE_MAPS_API_KEY"
        "DOC_MODEL_ID"
        "SUMM_MODEL_ID"
        "NEWS_MODEL_ID"
        "AGENT_MODEL_ID"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        return 1
    fi
    
    log_success "Environment validation passed"
}

build_application() {
    log_info "Building application..."
    
    # Build Docker images
    log_info "Building Docker images..."
    docker-compose build --no-cache
    
    # Tag the main image
    docker tag ${PROJECT_NAME}_app:latest ${DOCKER_IMAGE_NAME}:${VERSION}
    docker tag ${PROJECT_NAME}_app:latest ${DOCKER_IMAGE_NAME}:latest
    
    log_success "Application built successfully"
}

run_tests() {
    log_info "Running tests..."
    
    # Run unit tests
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        ${DOCKER_IMAGE_NAME}:${VERSION} \
        python -m pytest tests/ -v
    
    # Test chatbot endpoints
    log_info "Testing chatbot endpoints..."
    docker-compose up -d app
    sleep 30  # Wait for services to start
    
    # Health check
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
    if [ "$response" != "200" ]; then
        log_error "Health check failed"
        docker-compose down
        exit 1
    fi
    
    # Test chatbot endpoint
    response=$(curl -s -X POST http://localhost:5000/chatbot/message \
        -H "Content-Type: application/json" \
        -d '{"message":"Hello","user_id":"test","channel":"web","language":"en"}')
    
    if [[ $response == *"error"* ]]; then
        log_error "Chatbot endpoint test failed"
        docker-compose down
        exit 1
    fi
    
    docker-compose down
    
    log_success "All tests passed"
}

deploy_local() {
    log_info "Deploying locally..."
    
    # Stop existing services
    docker-compose down
    
    # Start all services
    docker-compose up -d
    
    log_info "Waiting for services to start..."
    sleep 60
    
    # Health checks
    services=("app:5000" "rasa:5005" "postgres:5432" "redis:6379")
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if ! nc -z localhost $port; then
            log_error "$name service is not responding on port $port"
            docker-compose logs $name
            exit 1
        fi
    done
    
    log_success "Local deployment completed"
    log_info "Application is running at:"
    log_info "  - Frontend: http://localhost:3000"
    log_info "  - Backend API: http://localhost:5000"
    log_info "  - Rasa NLP: http://localhost:5005"
    log_info "  - Grafana: http://localhost:3001"
    log_info "  - Kibana: http://localhost:5601"
}

deploy_aws() {
    log_info "Deploying to AWS..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Push Docker images to ECR
    log_info "Pushing images to ECR..."
    
    # Get ECR login token
    aws ecr get-login-password --region us-east-1 | \
        docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com
    
    # Tag and push images
    docker tag ${DOCKER_IMAGE_NAME}:${VERSION} \
        ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/${PROJECT_NAME}:${VERSION}
    
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/${PROJECT_NAME}:${VERSION}
    
    # Deploy using ECS or EKS
    if [ "$AWS_DEPLOYMENT_TYPE" = "ecs" ]; then
        deploy_aws_ecs
    elif [ "$AWS_DEPLOYMENT_TYPE" = "eks" ]; then
        deploy_aws_eks
    else
        log_error "AWS_DEPLOYMENT_TYPE must be 'ecs' or 'eks'"
        exit 1
    fi
    
    log_success "AWS deployment completed"
}

deploy_aws_ecs() {
    log_info "Deploying to AWS ECS..."
    
    # Update ECS service
    aws ecs update-service \
        --cluster ${AWS_ECS_CLUSTER} \
        --service ${AWS_ECS_SERVICE} \
        --force-new-deployment
    
    # Wait for deployment to complete
    aws ecs wait services-stable \
        --cluster ${AWS_ECS_CLUSTER} \
        --services ${AWS_ECS_SERVICE}
}

deploy_aws_eks() {
    log_info "Deploying to AWS EKS..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Update kubeconfig
    aws eks update-kubeconfig --region us-east-1 --name ${AWS_EKS_CLUSTER}
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/
    
    # Update deployment image
    kubectl set image deployment/${PROJECT_NAME} \
        app=${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/${PROJECT_NAME}:${VERSION}
    
    # Wait for rollout
    kubectl rollout status deployment/${PROJECT_NAME}
}

deploy_gcp() {
    log_info "Deploying to Google Cloud Platform..."
    
    # Check gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed"
        exit 1
    fi
    
    # Push to Container Registry
    docker tag ${DOCKER_IMAGE_NAME}:${VERSION} \
        gcr.io/${GCP_PROJECT_ID}/${PROJECT_NAME}:${VERSION}
    
    docker push gcr.io/${GCP_PROJECT_ID}/${PROJECT_NAME}:${VERSION}
    
    # Deploy to Cloud Run
    gcloud run deploy ${PROJECT_NAME} \
        --image gcr.io/${GCP_PROJECT_ID}/${PROJECT_NAME}:${VERSION} \
        --platform managed \
        --region us-central1 \
        --allow-unauthenticated \
        --set-env-vars "$(cat .env | grep -v '^#' | xargs -I {} echo {} | tr '\n' ',')"
    
    log_success "GCP deployment completed"
}

deploy_azure() {
    log_info "Deploying to Microsoft Azure..."
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed"
        exit 1
    fi
    
    # Push to Azure Container Registry
    az acr login --name ${AZURE_ACR_NAME}
    
    docker tag ${DOCKER_IMAGE_NAME}:${VERSION} \
        ${AZURE_ACR_NAME}.azurecr.io/${PROJECT_NAME}:${VERSION}
    
    docker push ${AZURE_ACR_NAME}.azurecr.io/${PROJECT_NAME}:${VERSION}
    
    # Deploy to Azure Container Instances
    az container create \
        --resource-group ${AZURE_RESOURCE_GROUP} \
        --name ${PROJECT_NAME} \
        --image ${AZURE_ACR_NAME}.azurecr.io/${PROJECT_NAME}:${VERSION} \
        --dns-name-label ${PROJECT_NAME} \
        --ports 3000 5000 \
        --environment-variables $(cat .env | grep -v '^#' | tr '\n' ' ')
    
    log_success "Azure deployment completed"
}

create_rasa_model() {
    log_info "Creating Rasa chatbot model..."
    
    # Create basic Rasa project structure if it doesn't exist
    if [ ! -d "chatbot" ]; then
        mkdir -p chatbot/{data,actions,models}
        
        # Create domain.yml
        cat > chatbot/domain.yml << EOF
version: "3.1"

intents:
  - greet
  - goodbye
  - health_query
  - symptom_check
  - vaccination_info
  - emergency_help

entities:
  - symptom
  - disease
  - age

responses:
  utter_greet:
  - text: "Hello! I'm your AI health assistant. How can I help you today?"
  
  utter_goodbye:
  - text: "Take care! Stay healthy and don't hesitate to reach out if you need help."

actions:
  - utter_greet
  - utter_goodbye
  - action_health_query
  - action_symptom_check

session_config:
  session_expiration_time: 60
  carry_over_slots_to_new_session: true
EOF

        # Create config.yml
        cat > chatbot/config.yml << EOF
version: "3.1"

recipe: default.v1

language: en

pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 4
  - name: DIETClassifier
    epochs: 100
    constrain_similarities: true
  - name: EntitySynonymMapper
  - name: ResponseSelector
    epochs: 100
    constrain_similarities: true
  - name: FallbackClassifier
    threshold: 0.3
    ambiguity_threshold: 0.1

policies:
  - name: MemoizationPolicy
  - name: RulePolicy
  - name: UnexpecTEDIntentPolicy
    max_history: 5
    epochs: 100
  - name: TEDPolicy
    max_history: 5
    epochs: 100
    constrain_similarities: true
EOF

        # Create training data
        cat > chatbot/data/nlu.yml << EOF
version: "3.1"

nlu:
- intent: greet
  examples: |
    - hello
    - hi
    - hey
    - good morning
    - good evening
    - namaste
    - hi there

- intent: goodbye
  examples: |
    - goodbye
    - bye
    - see you later
    - take care
    - exit
    - quit

- intent: health_query
  examples: |
    - I have a health question
    - Can you help me with health information?
    - I need medical advice
    - What should I do for my health?

- intent: symptom_check
  examples: |
    - I have [fever](symptom)
    - My [head](symptom) hurts
    - I'm feeling [nauseous](symptom)
    - I have [stomach pain](symptom)
    - What are symptoms of [dengue](disease)?

- intent: vaccination_info
  examples: |
    - When should I get vaccinated?
    - Vaccination schedule for children
    - COVID vaccine information
    - Where can I get vaccines?

- intent: emergency_help
  examples: |
    - This is an emergency
    - I need immediate help
    - Emergency medical assistance
    - Urgent health problem
EOF

        # Create stories
        cat > chatbot/data/stories.yml << EOF
version: "3.1"

stories:

- story: happy path
  steps:
  - intent: greet
  - action: utter_greet
  - intent: health_query
  - action: action_health_query
  - intent: goodbye
  - action: utter_goodbye

- story: symptom check
  steps:
  - intent: greet
  - action: utter_greet
  - intent: symptom_check
  - action: action_symptom_check
  - intent: goodbye
  - action: utter_goodbye
EOF

        log_success "Created basic Rasa project structure"
    fi
}

show_usage() {
    echo "Usage: $0 [COMMAND] [VERSION]"
    echo ""
    echo "Commands:"
    echo "  check       - Check dependencies and validate environment"
    echo "  build       - Build the application"
    echo "  test        - Run tests"
    echo "  local       - Deploy locally using Docker Compose"
    echo "  aws         - Deploy to AWS"
    echo "  gcp         - Deploy to Google Cloud Platform"
    echo "  azure       - Deploy to Microsoft Azure"
    echo "  rasa        - Create Rasa model structure"
    echo ""
    echo "Examples:"
    echo "  $0 build v1.0.0"
    echo "  $0 local"
    echo "  $0 aws latest"
}

# =============================================================================
# Main Script
# =============================================================================

case "${1:-help}" in
    "check")
        check_dependencies
        validate_environment
        ;;
    "build")
        check_dependencies
        validate_environment
        build_application
        ;;
    "test")
        check_dependencies
        validate_environment
        build_application
        run_tests
        ;;
    "local")
        check_dependencies
        validate_environment
        build_application
        deploy_local
        ;;
    "aws")
        check_dependencies
        validate_environment
        build_application
        deploy_aws
        ;;
    "gcp")
        check_dependencies
        validate_environment
        build_application
        deploy_gcp
        ;;
    "azure")
        check_dependencies
        validate_environment
        build_application
        deploy_azure
        ;;
    "rasa")
        create_rasa_model
        ;;
    "help"|*)
        show_usage
        ;;
esac