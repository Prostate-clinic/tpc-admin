import { redirect } from "next/navigation";

export default function DoctorsPage() {
  redirect("/admin/doctors/manage");
}
