import { ServersService } from "./servers";
import { CompetitionsService } from "./competitions";
import { UsersService } from "./users";

export const serversService = new ServersService();
export const competitionsService = new CompetitionsService();
export const usersService = new UsersService();

export * from "./servers";
export * from "./competitions";
export * from "./users";
