import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    profilePicture: user.imageUrl,
    username: user.username,
  };
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      take: 100,
    });

    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    console.log(users);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);

      if (!author || !author.username)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Author for post not found",
        });

      return {
        post,
        author,
      };
    });
  }),
});
