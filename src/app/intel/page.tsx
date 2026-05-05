import { redirect } from "next/navigation";

/** 原「情报筛选」入口已迁移至济和参谋 */
export default function IntelPageRedirect() {
  redirect("/canmou");
}
