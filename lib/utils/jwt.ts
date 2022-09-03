import { sign } from "jsonwebtoken";
import { Payload } from "../types/payload";

export const createAccessToken = ({ id, bot, v }: Payload) => {
  return sign({ id, bot, v }, process.env.JWT_ACCESS_TOKEN_SECRET!, {
    expiresIn: "1h",
  });
};

export const createRefreshToken = ({ id, bot, v }: Payload) => {
  return sign({ id, bot, v }, process.env.JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
};
