import { ApiService } from "../base";

export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  role: "admin" | "user";
  club_id?: string;
  server_id?: string;
  created_at: string;
  updated_at: string;
};

export class UsersService extends ApiService {
  private endpoint = "users";

  async getAll(): Promise<User[]> {
    const response = await this.get<User[]>(this.endpoint);
    return response.data;
  }

  async getById(id: string): Promise<User> {
    const response = await this.get<User>(this.endpoint, { id });
    return response.data;
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.get<UserProfile>(`${this.endpoint}/me`);
    return response.data;
  }

  async updateRole(id: string, role: "admin" | "user"): Promise<User> {
    const response = await this.put<User>(this.endpoint, id, { role });
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await this.delete(this.endpoint, id);
  }
}
