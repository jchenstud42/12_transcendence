BACKEND_DIR 	= Backend
FRONT_DIR		= Frontend

RESET			= \e[0m
BLACK    		= \e[1;30m
RED      		= \e[1;31m
GREEN    		= \e[1;32m
YELLOW   		= \e[1;33m
BLUE     		= \e[1;34m
MAGENTA  		= \e[1;35m
CYAN     		= \e[1;36m
WHITE    		= \e[1;37m

SILENT		=	> /dev/null 2>&1



all: build up

build:
	@echo "$(RED)"B"$(YELLOW)"u"$(GREEN)"i"$(CYAN)"l"$(BLUE)"d"$(MAGENTA)"i"$(RED)"n"$(YELLOW)"g"$(CYAN)"."$(BLUE)"."$(MAGENTA)"." " 👷👷​​​" $(RESET)"
	@docker compose build && cd Backend && npx tsc
	@cd Frontend && npm run build
	@echo "$(RED)"D"$(YELLOW)"o"$(GREEN)"n"$(CYAN)"e" $(BLUE)"!"$(MAGENTA) "🥳​​​​" $(RESET)"

up:
	@echo "$(RED)"S"$(YELLOW)"t"$(GREEN)"a"$(CYAN)"r"$(BLUE)"t"$(MAGENTA)"i"$(RED)"n"$(YELLOW)"g"$(CYAN)"."$(BLUE)"."$(MAGENTA)"." " ⌚​​​" $(RESET)"
	@docker compose up -d
	@echo "$(RED)"S"$(YELLOW)"t"$(GREEN)"a"$(CYAN)"r"$(BLUE)"t"$(MAGENTA)"e"$(RED)"d" "🥳​​​​" $(RESET)"

down:
	@echo "$(RED)"S"$(YELLOW)"t"$(GREEN)"o"$(CYAN)"p"$(BLUE)"p"$(MAGENTA)"i"$(RED)"n"$(YELLOW)"g"$(CYAN)"."$(BLUE)"."$(MAGENTA)"." " ✋🛑​​​" $(RESET)"
	@docker compose down $(SILENT)
	@echo "$(RED)"S"$(YELLOW)"t"$(GREEN)"o"$(CYAN)"p"$(BLUE)"p"$(MAGENTA)"e"$(RED)"d" "🥳​​​​" $(RESET)"

ps:
	@echo "$(RED)"L"$(YELLOW)"i"$(GREEN)"s"$(CYAN)"t"$(BLUE)"i"$(MAGENTA)"n"$(RED)"g"$(YELLOW)"."$(CYAN)"."$(BLUE)"." " 📋​​​" $(RESET)"
	@docker ps -a

logs:
	@echo "$(RED)"L"$(YELLOW)"o"$(GREEN)"g"$(CYAN)"g"$(BLUE)"i"$(MAGENTA)"n"$(RED)"g"$(YELLOW)"."$(CYAN)"."$(BLUE)"." " 📁​​​" $(RESET)"
	@docker compose logs -f

clean:
	@echo "$(RED)"C"$(YELLOW)"l"$(GREEN)"e"$(CYAN)"a"$(BLUE)"n"$(MAGENTA)"i"$(RED)"n"$(YELLOW)"g" $(CYAN)"."$(BLUE)"."$(MAGENTA)"." " 🧹​​​" $(RESET)"
	@docker compose down
	@rm -rf $(BACKEND_DIR)/dist
	@rm -rf $(FRONT_DIR)/js
	@echo "$(RED)"C"$(YELLOW)"l"$(GREEN)"e"$(CYAN)"a"$(BLUE)"n"$(MAGENTA)"!" "🥳​​​​" $(RESET)"

fclean:
	@echo "$(RED)F$(YELLOW)u$(GREEN)l$(CYAN)l $(BLUE)"C"$(MAGENTA)"l"$(RED)"e"$(YELLOW)"a"$(GREEN)"n"$(CYAN)"i"$(BLUE)"n"$(MAGENTA)"g" $(RED)"."$(YELLOW)"."$(GREEN)"." " 🧹​​​" $(RESET)"
	@docker compose down --volumes --rmi all
	@rm -rf $(BACKEND_DIR)/database/* || true
	@rm -rf $(BACKEND_DIR)/dist
	@rm -rf $(FRONT_DIR)/js
	@echo "$(RED)"C"$(YELLOW)"l"$(GREEN)"e"$(CYAN)"a"$(BLUE)"n"$(MAGENTA)"!" "🥳​​​​" $(RESET)"

re: fclean build up

.PHONY : all build dev up down ps logs clean fclean re
