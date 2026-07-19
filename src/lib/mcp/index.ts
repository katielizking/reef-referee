import { defineMcp } from "@lovable.dev/mcp-js";
import searchSpecies from "./tools/search-species";
import getSpecies from "./tools/get-species";
import listPlants from "./tools/list-plants";
import recommendFilters from "./tools/list-filters";
import listHardscape from "./tools/list-hardscape";
import findShops from "./tools/find-shops";
import listBlogPosts from "./tools/list-blog-posts";
import getBlogPost from "./tools/get-blog-post";
import calculateTankLitres from "./tools/tank-litres";

export default defineMcp({
  name: "fishtankr-mcp",
  title: "FishTankr",
  version: "0.1.0",
  instructions:
    "Read-only access to FishTankr's freshwater aquarium reference catalog: species (with Australian legal status), plants, filters, hardscape, aquarium shops, blog posts, and a tank-volume calculator. Does not access any user's saved tanks.",
  tools: [
    searchSpecies,
    getSpecies,
    listPlants,
    recommendFilters,
    listHardscape,
    findShops,
    listBlogPosts,
    getBlogPost,
    calculateTankLitres,
  ],
});
