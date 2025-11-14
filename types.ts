import { Type, type Static } from "@sinclair/typebox";
import type { FastifySchema, RouteGenericInterface, RouteHandler } from "fastify";

export type RouteType<T extends RouteGenericInterface = any> = {
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string;
  schema?: FastifySchema;
  handler: RouteHandler<T>;
};

export interface AnimeInfoBase {
  name: string,
  CN_name: string;
  description: string;
  images: { type: string, url: string, imgShowUrl: string; }[];
  videos: {
    type: string,
    size: string,
    url: string;
    imgShowUrl: string;
    cover: string;
  }[];
  tags: string[];
}

export const ImgProxy = Type.Object({
  url: Type.String(),
});

export const SearchValue = Type.Object({
  value: Type.Union([Type.String(), Type.Number()])
});

export type ImgProxyType = Static<typeof ImgProxy>;
export type SearchValueType = Static<typeof SearchValue>;
