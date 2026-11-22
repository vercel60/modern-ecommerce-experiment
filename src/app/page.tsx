import { Studio } from "@/components/studio/Studio";
import { getCatalog } from "@/lib/getCatalog";

export default async function Home() {
  return <Studio catalog={await getCatalog()} />;
}
