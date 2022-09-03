import { JwtPayload } from "jsonwebtoken";

export interface Payload extends JwtPayload {
  id: string;
  bot: boolean;
  v: number;
}
