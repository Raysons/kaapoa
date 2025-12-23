// src/components/modals/SupplierModal.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Supplier, SupplierStatus } from "@/types/supplier";

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  taxId: z.string().optional(),
  website: z.string().url("Invalid URL").or(z.literal("")).optional(),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  status: z.enum(["active", "inactive", "pending"]),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSave: (data: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => void;
}

const categoryOptions = [
  "Electronics",
  "Furniture",
  "Office Supplies",
  "Raw Materials",
  "Packaging",
  "Textiles",
  "Other",
];

const paymentTermOptions = [
  "Net 15",
  "Net 30",
  "Net 60",
  "Due on Receipt",
  "50% Advance, 50% on Delivery",
  "100% Advance",
];

export function SupplierModal({
  isOpen,
  onClose,
  supplier,
  onSave,
}: SupplierModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      status: "active",
      paymentTerms: "Net 30",
      categories: [],
    },
  });

  const selectedCategories = watch("categories") || [];

  useEffect(() => {
    if (supplier) {
      // Set form values when editing
      Object.entries(supplier).forEach(([key, value]) => {
        if (key in supplierSchema.shape) {
          setValue(key as any, value);
        }
      });
    } else {
      // Reset form when adding new
      reset({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        postalCode: "",
        taxId: "",
        website: "",
        categories: [],
        status: "active",
        paymentTerms: "Net 30",
        notes: "",
      });
    }
  }, [supplier, setValue, reset]);

  const handleCategoryChange = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setValue("categories", newCategories);
  };

  const onSubmit = (data: SupplierFormData) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                placeholder="Enter company name"
                {...register("name")}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                placeholder="Enter contact person name"
                {...register("contactPerson")}
                error={errors.contactPerson?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                {...register("phone")}
                error={errors.phone?.message}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="Enter street address"
                {...register("address")}
                error={errors.address?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                placeholder="Enter city"
                {...register("city")}
                error={errors.city?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                placeholder="Enter country"
                {...register("country")}
                error={errors.country?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code *</Label>
              <Input
                id="postalCode"
                placeholder="Enter postal code"
                {...register("postalCode")}
                error={errors.postalCode?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                placeholder="Enter tax ID"
                {...register("taxId")}
                error={errors.taxId?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                {...register("website")}
                error={errors.website?.message}
              />
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                onValueChange={(value: SupplierStatus) =>
                  setValue("status", value)
                }
                value={watch("status")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Terms *</Label>
              <Select
                onValueChange={(value) => setValue("paymentTerms", value)}
                value={watch("paymentTerms")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermOptions.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentTerms && (
                <p className="text-sm text-destructive">
                  {errors.paymentTerms.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Categories *</Label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={
                      selectedCategories.includes(category)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              {errors.categories && (
                <p className="text-sm text-destructive">
                  {errors.categories.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this supplier..."
                className="min-h-[100px]"
                {...register("notes")}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              {supplier ? "Update Supplier" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}