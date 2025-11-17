import FormData from "form-data";
import axios from "axios";
import type { FastifyRequest } from "fastify";
import { PassThrough } from "stream";
import { ImgProxy, SearchValue, type ImgProxyType, type RouteType, type SearchValueType } from "types";
import { AnimeCrawler } from "crawler";
import { proxyAgent } from "proxyAgent";
import { noodlemagazineCrawler } from "crawler_noodlemagazine";

type MessageParams = {
  title: string;
  botToken: string;
  chatId: string;
  caption: string;
  parse_mode: string;
  media: any[];
};

export const routes: RouteType[] = [
  {
    method: "GET",
    url: "/searchAnime",
    schema: SearchValue,
    handler: async (req: FastifyRequest<{ Querystring: SearchValueType; }>, res) => {
      try {
        let { value, site } = req.query;
        if (typeof value === "string" && !value.trim()) return;
        if (site === "noodlemagazine") return { data: await noodlemagazineCrawler(value as string) };
        if (!Number.isNaN(+value)) value = +value;
        return { data: await AnimeCrawler(value) };
      } catch (error: any) {
        console.log("error searchAnime", error);
      }
    }
  },
  {
    method: "POST",
    url: "/sendMessage",
    handler: async (req: FastifyRequest, res) => {
      try {
        const parts = req.parts();
        const info = {} as MessageParams;
        const form = new FormData();
        for await (const part of parts) {
          if (part.type === "file") {
            const passthrough = new PassThrough();
            part.file.pipe(passthrough);
            form.append(part.filename, passthrough, part.filename);
            await part.toBuffer();
          } else {
            Object.assign(info, JSON.parse(part.value as any));
          }
        }
        if (!info.media.length) return;

        for (const item of info.media) {
          if (!item.media.startsWith("http") || item.type !== "video") continue;
          const response = await axios.get(item.media, {
            httpsAgent: proxyAgent,
            responseType: 'stream',
          });
          form.append(info.title, response.data, info.title);
          item.media = `attach://${info.title}`;
        }

        const media1 = info.media[0];
        media1.caption = info.caption;
        media1.parse_mode = info.parse_mode;
        form.append("chat_id", info.chatId);
        form.append("media", JSON.stringify(info.media));

        const res1 = await axios.post(`${process.env.API_URL}/bot${info.botToken}/sendMediaGroup`, form, {
          httpsAgent: proxyAgent,
        });
        return res1.data;

      } catch (error: any) {
        console.log("error sendMessage", error);
        res.status(502);
        throw new Error("Message sending failed.");
      }
    }
  },
  {
    method: "GET",
    url: "/imgProxy",
    schema: {
      querystring: ImgProxy
    },
    handler: async (req: FastifyRequest<{ Querystring: ImgProxyType; }>, res) => {
      const url = req.url.split("?url=")[1];
      const response = await axios.get(url, {
        httpsAgent: proxyAgent,
        responseType: 'stream',
      });
      res.header('Content-Type', response.headers['content-type'] || 'image/jpeg');

      return response.data;
    }
  },
  {
    method: "GET",
    url: "/videoProxy",
    schema: {
      querystring: ImgProxy
    },
    handler: async (req: FastifyRequest<{ Querystring: ImgProxyType; }>, res) => {
      try {
        const url = req.url.split("?url=")[1];
        const range = req.headers.range || 'bytes=0-';
        const headers: any = { Range: range, "referer": url };
        const response = await axios.get(url, {
          httpsAgent: proxyAgent,
          responseType: 'stream',
          headers
        });

        res.headers({
          'Content-Type': response.headers['content-type'] || 'video/mp4',
          'Content-Range': response.headers['content-range'],
          'Content-Length': response.headers['content-length'],
        });
        if (range) res.code(206);

        return response.data;
      } catch (error: any) {
        console.log("error videoProxy", error.response?.data);
        throw new Error("load error");
      }
    }
  }
];