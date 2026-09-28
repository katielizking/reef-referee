import { createFileRoute, notFound } from "@tanstack/react-router";
import { IdeaCollectionPage } from "@/components/IdeaCollectionPage";
import { collectionHead, collectionPath, findCollection } from "@/lib/tank-idea-collections";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/tank-ideas/type/$type")({
  loader: ({ params }) => {
    const collection = findCollection("type", params.type);
    if (!collection) throw notFound();
    return collection;
  },
  head: ({ loaderData }) =>
    loaderData ? collectionHead(loaderData, absoluteUrl(collectionPath(loaderData))) : {},
  component: function Page() {
    return <IdeaCollectionPage collection={Route.useLoaderData()} />;
  },
});
