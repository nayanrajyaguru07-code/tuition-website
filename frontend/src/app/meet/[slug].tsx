// pages/meet/[slug].tsx
import dynamic from "next/dynamic";
const MeetingClient = dynamic(() => import("../pages/meetingClient"), {
  ssr: false,
});
export default function Page() {
  return <MeetingClient />;
}
