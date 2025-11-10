import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/user.service.js";
import { validateEmail, validateTextInput, validatePassword, sanitizeInput } from "../../security/inputSecurity.js";
import { hashPassword } from "../../security/passHash.js";

const userService = new UserService();

export class UserController
{
	
}