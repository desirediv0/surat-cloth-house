import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SupplementStoreUI = () => {
  const router = useRouter();

  return (
    <div className="bg-white py-12 md:py-16 px-4">
      <div className="container mx-auto">

        {/* ---- MOBILE IMAGE (small screens) ---- */}
        <div
          className="block md:hidden cursor-pointer"
          onClick={() => router.push("/products")}
        >
          <Image
            src={"/sales.jpg"}
            width={500}
            height={500}
            alt="Sales Mobile"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ---- DESKTOP IMAGE (large screens) ---- */}
        <div
          className="hidden md:block cursor-pointer"
          onClick={() => router.push("/products")}
        >
          <Image
            src={"/saleb.jpg"}
            width={1200}
            height={600}
            alt="Sales Desktop"
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
};

export default SupplementStoreUI;
