import axios from "axios";
import { jikanFetch } from "./jikanQueue";

const jikan = axios.create({
  baseURL: import.meta.env.VITE_JIKAN_BASE || "https://api.jikan.moe/v4",
  timeout: 20000,
});

export const searchAnime = async (params = {}) => {
  const { data } = await jikanFetch(jikan, "/anime", {
    params: { limit: 24, sfw: true, ...params },
  });
  return data;
};

export const getAnimeById = async (id) => {
  const { data } = await jikanFetch(jikan, `/anime/${id}/full`);
  return data.data;
};

export const getAnimeCharacters = async (id) => {
  const { data } = await jikanFetch(jikan, `/anime/${id}/characters`);
  return data.data;
};

export const getAnimeStaff = async (id) => {
  const { data } = await jikanFetch(jikan, `/anime/${id}/staff`);
  return data.data;
};

export const getAnimeRecommendations = async (id) => {
  const { data } = await jikanFetch(jikan, `/anime/${id}/recommendations`);
  return data.data;
};

export const getTopAnime = async (filter, page = 1) => {
  const { data } = await jikanFetch(jikan, "/top/anime", {
    params: { filter, page, limit: 24, sfw: true },
  });
  return data;
};

export const getSeasonal = async (year, season, page = 1) => {
  const { data } = await jikanFetch(jikan, `/seasons/${year}/${season}`, {
    params: { page, limit: 24, sfw: true },
  });
  return data;
};

export const getGenres = async () => {
  const { data } = await jikanFetch(jikan, "/genres/anime");
  return data.data;
};
