"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientOnly } from "@/components/client-only";
import { DynamicIcon } from "@/components/dynamic-icon";
import { fetchApi, formatDate } from "@/lib/utils";
import Image from "next/image";
import { ProtectedRoute } from "@/components/protected-route";

export default function AccountPage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    profileImage: null,
  });
  const [preview, setPreview] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        profileImage: null,
      });
    }
  }, [user]);

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;

      try {
        const response = await fetchApi("/users/addresses", {
          credentials: "include",
        });
        setAddresses(response.data.addresses || []);
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      }
    };

    fetchAddresses();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "profileImage" && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        profileImage: files[0],
      }));

      // Create preview URL
      const file = files[0];
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await updateProfile(formData);
      setIsEditing(false);
      setMessage({
        type: "success",
        text: "Profile updated successfully",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <ClientOnly>
        <div className="container mx-auto py-10 px-4">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>

          {/* Profile information */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-4 lg:p-6">
              <div className="flex justify-between gap-2 items-center mb-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    size="sm"
                  >
                    <DynamicIcon name="Edit" className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {message.text && (
                <div
                  className={`mb-4 p-3 rounded ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSubmit} className="mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="lg:col-span-2 flex gap-2 justify-end mt-4">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setPreview(null);
                          setFormData({
                            name: user?.name || "",
                            phone: user?.phone || "",
                            profileImage: null,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Full Name
                      </h3>
                      <p className="mt-1 text-base">
                        {user?.name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Email Address
                      </h3>
                      <p className="mt-1 text-base">
                        {user?.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Phone Number
                      </h3>
                      <p className="mt-1 text-base">
                        {user?.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Member Since
                      </h3>
                      <p className="mt-1 text-base">
                        {user?.createdAt
                          ? formatDate(user.createdAt)
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent addresses */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-4 lg:p-6">
              <div className="flex justify-between gap-2 items-center mb-4">
                <h2 className="text-lg lg:text-xl font-semibold">
                  Saved Addresses
                </h2>
                <Link href="/account/addresses">
                  <Button
                    variant="outline"
                    size="sm"
                    className=" text-wrap py-2"
                  >
                    Manage Addresses
                  </Button>
                </Link>
              </div>

              {addresses.length > 0 ? (
                <div className="grid gap-4">
                  {addresses.slice(0, 2).map((address) => (
                    <div
                      key={address.id}
                      className="border rounded-md p-3 flex justify-between items-start"
                    >
                      <div>
                        {address.isDefault && (
                          <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md mb-2">
                            Default
                          </span>
                        )}
                        <p className="font-medium">
                          {address.name || user?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.street}, {address.city}, {address.state}{" "}
                          {address.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.country}
                        </p>
                      </div>
                    </div>
                  ))}

                  {addresses.length > 2 && (
                    <p className="text-sm text-gray-600">
                      + {addresses.length - 2} more addresses
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border rounded-md">
                  <DynamicIcon
                    name="MapPin"
                    className="h-8 w-8 mx-auto text-gray-400 mb-2"
                  />
                  <p className="text-gray-600">No addresses added yet</p>
                  <Link href="/account/addresses" className="mt-2 inline-block">
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Address
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Security section */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Security</h2>
              <div className="space-y-4">
                <Link href="/account/change-password">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <DynamicIcon name="Lock" className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </ProtectedRoute>
  );
}
