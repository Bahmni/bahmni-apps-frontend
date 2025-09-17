#!/bin/bash

# Developer Menu with Numbered Shortcuts
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} Bahmni Frontend -  Developer Menu${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
}

print_menu() {
    echo ""
    echo -e "${GREEN} BUILD COMMANDS:${NC}"
    echo -e "  ${YELLOW}1${NC} - Start the development server ${CYAN}(yarn nx serve distro)${NC}"
    echo -e "  ${YELLOW}2${NC} - Build the application for production ${CYAN}(yarn nx build distro)${NC}"
    echo -e "  ${YELLOW}3${NC} - Build clinical app ${CYAN}(yarn nx build clinical)${NC}"
    echo -e "  ${YELLOW}4${NC} - Build registration app ${CYAN}(yarn nx build registration)${NC}"
    echo ""
    echo -e "${GREEN} TEST COMMANDS:${NC}"
    echo -e "  ${YELLOW}5${NC} - Run all tests ${CYAN}(yarn nx run-many --target=test)${NC}"
    echo -e "  ${YELLOW}6${NC} - Run tests for clinical app ${CYAN}(yarn nx test clinical)${NC}"
    echo -e "  ${YELLOW}7${NC} - Run tests for registration app ${CYAN}(yarn nx test registration)${NC}"
    echo -e "  ${YELLOW}8${NC} - Run tests in watch mode ${CYAN}(yarn nx run-many --target=test --all --watch)${NC}"
    echo -e "  ${YELLOW}9${NC} - Run tests with coverage report ${CYAN}(yarn nx run-many --target=test --coverage)${NC}"
    echo ""
    echo -e "${GREEN} DEVELOPMENT SERVERS:${NC}"
    echo -e "  ${YELLOW}10${NC} - Start clinical app development server ${CYAN}(yarn nx serve clinical)${NC}"
    echo -e "  ${YELLOW}11${NC} - Start registration app development server ${CYAN}(yarn nx serve registration)${NC}"
    echo ""
    echo -e "${GREEN} CODE QUALITY:${NC}"
    echo -e "  ${YELLOW}12${NC} - Run ESLint to check for code quality issues ${CYAN}(yarn nx run-many --target=lint)${NC}"
    echo -e "  ${YELLOW}13${NC} - Fix ESLint issues automatically ${CYAN}(yarn nx run-many --target=lint --fix)${NC}"
    echo -e "  ${YELLOW}14${NC} - Format code with Prettier ${CYAN}(yarn nx format:write)${NC}"
    echo -e "  ${YELLOW}15${NC} - TypeScript type checking ${CYAN}(yarn typecheck)${NC}"
    echo ""
    echo -e "${GREEN} UTILITIES:${NC}"
    echo -e "  ${YELLOW}16${NC} - Clean all build artifacts ${CYAN}(yarn clean)${NC}"
    echo -e "  ${YELLOW}17${NC} - Install dependencies ${CYAN}(yarn)${NC}"
    echo ""
    echo -e "${GREEN} QUICK WORKFLOWS:${NC}"
    echo -e "  ${YELLOW}18${NC} - Full development setup ${CYAN}(clean + install + build packages)${NC}"
    echo -e "  ${YELLOW}19${NC} - Pre-commit check ${CYAN}(yarn nx run-many --target=lint --fix && yarn nx run-many --target=test && yarn nx build distro)${NC}"
    echo ""
    echo -e "${PURPLE}0${NC} - Exit"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN} $1${NC}"
}

print_info() {
    echo -e "${BLUE}  $1${NC}"
}

print_error() {
    echo -e "${RED} $1${NC}"
}

execute_command() {
    local cmd="$1"
    local description="$2"
    
    print_info "$description"
    echo -e "${CYAN}Executing: $cmd${NC}"
    echo ""
    
    if eval "$cmd"; then
        print_success "Command completed successfully!"
    else
        print_error "Command failed!"
        return 1
    fi
}

main() {
    while true; do
        clear
        print_header
        print_menu
        
        echo -n "Enter your choice (0-20): "
        read -r choice
        
        case $choice in
            1)
                print_info "Starting the development server... (Press Ctrl+C to stop)"
                yarn nx serve distro
                ;;
            2)
                execute_command "yarn nx build distro" "Building the application for production..."
                ;;
            3)
                execute_command "yarn nx build clinical" "Building clinical app..."
                ;;
            4)
                execute_command "yarn nx build registration" "Building registration app..."
                ;;
            5)
                execute_command "yarn nx run-many --target=test" "Running all tests..."
                ;;
            6)
                execute_command "yarn nx test clinical" "Running clinical app tests..."
                ;;
            7)
                execute_command "yarn nx test registration" "Running registration app tests..."
                ;;
            8)
                print_info "Starting tests in watch mode... (Press Ctrl+C to stop)"
                yarn nx run-many --target=test --all --watch
                ;;
            9)
                execute_command "yarn nx run-many --target=test --coverage" "Running tests with coverage report..."
                ;;
            10)
                print_info "Starting clinical app development server... (Press Ctrl+C to stop)"
                yarn nx serve clinical
                ;;
            11)
                print_info "Starting registration app development server... (Press Ctrl+C to stop)"
                yarn nx serve registration
                ;;
            12)
                execute_command "yarn nx run-many --target=lint" "Running ESLint to check for code quality issues..."
                ;;
            13)
                execute_command "yarn nx run-many --target=lint --fix" "Fixing ESLint issues automatically..."
                ;;
            14)
                execute_command "yarn nx format:write" "Formatting code with Prettier..."
                ;;
            15)
                execute_command "yarn typecheck" "Running TypeScript type checking..."
                ;;
            16)
                execute_command "yarn clean" "Cleaning build artifacts..."
                ;;
            17)
                execute_command "yarn" "Installing dependencies..."
                ;;
            18)
                print_info "Running full development setup..."
                execute_command "yarn clean" "Cleaning..."
                execute_command "yarn" "Installing dependencies..."
                execute_command "yarn build:packages" "Building packages..."
                print_success "Development setup complete! You can now start development servers."
                ;;
            19)
                print_info "Running pre-commit checks..."
                execute_command "yarn nx run-many --target=lint --fix" "Linting and fixing..."
                execute_command "yarn nx run-many --target=test" "Running tests..."
                execute_command "yarn nx build distro" "Building application..."
                print_success "Pre-commit checks complete! Ready to commit."
                ;;
            0)
                print_info "Goodbye! Happy coding!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter a number between 0-19."
                ;;
        esac
        
        if [ "$choice" != "8" ] && [ "$choice" != "9" ] && [ "$choice" != "10" ] && [ "$choice" != "11" ]; then
            echo ""
            echo -e "${YELLOW}Press Enter to continue...${NC}"
            read -r
        fi
    done
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi