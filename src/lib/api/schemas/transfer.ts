import { z } from "zod";

export const listPlayersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  position: z.string().optional(),
  nationality: z.string().optional(),
  status: z.enum(["free", "club", "auction_only", "loan"]).optional(),
  minOverall: z.coerce.number().min(1).max(99).optional(),
  maxOverall: z.coerce.number().min(1).max(99).optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
});

export type ListPlayersParams = z.infer<typeof listPlayersSchema>;
