import dynamic from "next/dynamic";

const Skillet = dynamic(() => import("../components/Skillet"), {
  ssr: false,
});

export default function Home() {
  return <Skillet />;
}
