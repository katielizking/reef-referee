import { createFileRoute, notFound } from "@tanstack/react-router";
import { IdeaCollectionPage } from "@/components/IdeaCollectionPage";
import { collectionHead, collectionPath, findCollection } from "@/lib/tank-idea-collections";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/tank-ideas/fish/$fish")({
  loader: ({ params }) => {
    const collection = findCollection("fish", params.fish);
    if (!collection) throw notFound();
    return collection;
  },
  head: ({ loaderData }) =>
    loaderData ? collectionHead(loaderData, absoluteUrl(collectionPath(loaderData))) : {},
  component: function Page() {
    return <IdeaCollectionPage collection={Route.useLoaderData()} />;
  },
});
