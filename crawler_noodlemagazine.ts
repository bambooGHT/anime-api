import { getDocument } from "getDocument";
import type { AnimeInfoBase } from "types";

const baseURL = "https://noodlemagazine.com";

export const noodlemagazineCrawler = async (param: string): Promise<AnimeInfoBase[]> => {
  const v = param.replace(/[-_]/g, '');
  if (/^\d+$/.test(v)) {
    const video = await getVideoInfo("/watch/" + param);
    return video ? [video] : [];
  }
  return searchVideo(param);
};

const searchVideo = async (text: string): Promise<AnimeInfoBase[]> => {
  const document = await reqNoodlemagazineWindow("/video/" + text);
  if (!document) return [];

  const videoUrlList = [...document.querySelectorAll<HTMLAnchorElement>("#list_videos a")].slice(0, 4).map(p => {
    return p.href;
  });

  return (await Promise.all(videoUrlList.map(getVideoInfo))).filter(Boolean) as AnimeInfoBase[];
};

const getVideoInfo = async (path: string): Promise<AnimeInfoBase | undefined> => {
  const document = await reqNoodlemagazineWindow(path);
  if (!document) return document;

  const playListStr = [...document.querySelectorAll("script")].find(p => {
    return p.textContent.includes("playlist");
  })!;
  const playList = new Function(`
    ${playListStr.textContent.replaceAll("window.", "const ")}
    return playlist;
  `)();
  
  const imgs = [playList.image];
  if (playList.tracks?.[0]) {
    const thumbnailsData = await getDocument(baseURL + playList.tracks[0].file);
    const thumbnails = thumbnailsData.querySelector("pre")!.textContent.split("\n").filter((p: string) => p.startsWith("https"));
    imgs.push(thumbnails[Math.floor(thumbnails.length / 2)]);
  }
  const cover = imgs[1] || imgs[0];
  return {
    name: document.querySelector<HTMLHeadingElement>("h1")!.childNodes.item(0).textContent!,
    CN_name: "",
    description: "",
    images: imgs.map(p => ({
      type: "image/jpeg",
      url: p
    })),

    videos: [playList.sources[0]].map(p => {
      return {
        type: "video/" + p.type,
        size: p.label + "p",
        url: p.file,
        imgShowUrl: cover,
        cover: imgs[0],
      };
    }),
    tags: []
  };
};

const reqNoodlemagazineWindow = async (path: string) => {
  return await getDocument(path.startsWith("https") ? path : baseURL + path);
};