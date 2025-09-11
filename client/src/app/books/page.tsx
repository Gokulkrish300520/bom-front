import Image from "next/image";

export default function BooksPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Image
        src="/glonix_logo.png"
        alt="Glonix Electronics Logo"
        width={500}
        height={80}
        className="mb-4"
      />
    </div>
  );
}
