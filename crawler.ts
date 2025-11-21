import { getDocument } from 'getDocument';
import type { AnimeInfoBase } from "types";

const baseURL = "https://hanime1.com";

export const AnimeCrawler = async (param: string | number): Promise<AnimeInfoBase[]> => {
  if (typeof param === 'string') return searchAnime(param);

  const data = await getAnimeInfo(param);
  return data ? [data] : [];
};

const searchAnime = async (text: string): Promise<AnimeInfoBase[]> => {
  const animeIdList = await reqAnimeSearchResult(text);
  if (!animeIdList.length) return [];

  return (await Promise.all(animeIdList.map(getAnimeInfo))).filter(Boolean) as AnimeInfoBase[];
};

const reqAnimeSearchResult = async (text: string) => {
  console.log(`/search?query=${text}`);

  const document = await reqAnimeHTML(`/search?query=${text}`);
  let results = [...document.querySelector("div.row")?.querySelectorAll<HTMLAnchorElement>("div.hidden-xs a.overlay") || []].slice(0, 6);
  let el = results.find(p => {
    const title = p.parentElement?.title;
    return title!.split("] ")[1] === text || title === text;
  });

  if (!results.length) {
    results = [...document.querySelector(".home-rows-videos-wrapper")!.children] as HTMLAnchorElement[];
    if (!results.length) return [];
    el = results.find(p => {
      const title = p.querySelector(".home-rows-videos-title")!.textContent;
      return title === text;
    });
  }

  return (el ? [el] : results).map(p => {
    const v = p.href.split("v=")?.[1];
    return v ? +v : undefined;
  }).filter(Boolean) as number[];
};

const getAnimeInfo = async (id: number): Promise<AnimeInfoBase | undefined> => {
  const document = await reqAnimeHTML(`/watch?v=${id}`);
  if (!document) return document;

  const infoEls = document.querySelector("div.video-description-panel")!.children;
  const videoEl = document.querySelector("video")!;
  const title = document.querySelector("#shareBtn-title")!.textContent;
  const CN_title = title.includes("中文") ? infoEls.item(1)!.textContent : "";
  const info = infoEls.item(2)!.textContent;

  const videoImage = videoEl.getAttribute("poster")!;
  const videoArtistUrl = decodeURIComponent(document.querySelector<HTMLAnchorElement>("#video-artist-name")!.href);
  const videoCover = videoArtistUrl.includes("裏番") ? await getAnimeCover(`/search?query=${infoEls.item(1)!.textContent}&genre=裏番`, infoEls.item(1)!.textContent) : videoImage;
  const coverProxy = "/imgProxy?url=" + videoCover;
  const imageProxy = "/imgProxy?url=" + videoImage;
  const videoResList = [...videoEl.children] as HTMLSourceElement[];
  const maxVideo = videoResList.length > 1 ? videoResList.reduce((max, item) => +item.getAttribute("size")! > +max.getAttribute("size")! ? item : max) : videoResList[0];
  const video = {
    type: maxVideo.type,
    size: maxVideo.getAttribute("size") + "p",
    url: maxVideo.src,
    imgShowUrl: imageProxy,
    cover: videoImage,
  };
  const tags = document.querySelector(".video-tags-wrapper")!.querySelectorAll<HTMLAnchorElement>("a[href]").values().map(item => {
    return ([...item.childNodes].find((e) => {
      return e.constructor.name === "Text";
    }) as HTMLTextAreaElement).textContent.trim();
  }).toArray();

  return {
    name: title,
    CN_name: CN_title === title ? "" : CN_title,
    description: info,
    images: [
      {
        type: "image/jpeg",
        url: videoCover,
        imgShowUrl: coverProxy
      }
    ],
    videos: [video],
    tags
  };
};

const getAnimeCover = async (url: string, title: string) => {
  const document = await reqAnimeHTML(url);
  const item = [...document.querySelector("div.home-rows-videos-wrapper")!.children].find(p => {
    return p.textContent.includes(title);
  })!;

  return item.querySelector("img")!.src;
};

const reqAnimeHTML = async (path: string) => {
  return await getDocument(path.startsWith("https") ? path : baseURL + path);
};