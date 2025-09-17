import Navbar from "@/components/Navbar";

export default function Layout({ children }) {
  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>
      <div className="pt-16">{children}</div>
    </>
  );
}
