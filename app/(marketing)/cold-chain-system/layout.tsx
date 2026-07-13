import SystemSubNav from "@/components/cold-chain/SystemSubNav";

export default function ColdChainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SystemSubNav />
      {children}
    </>
  );
}
