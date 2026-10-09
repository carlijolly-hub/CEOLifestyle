import React from "react";
import { ContactSupplierDirectoryManager } from "./ContactSupplierDirectoryManager";
import { SupplierRecord } from "../types";

interface SupplierDirectoryManagerProps {
  suppliers?: SupplierRecord[];
  onUpdateSuppliers?: (updatedSuppliers: SupplierRecord[]) => void;
}

export function SupplierDirectoryManager({ suppliers, onUpdateSuppliers }: SupplierDirectoryManagerProps) {
  return (
    <ContactSupplierDirectoryManager
      contacts={suppliers}
      onUpdateContacts={onUpdateSuppliers}
    />
  );
}

export function normalizeSupplierContacts(sup: any) {
  return sup?.phoneContacts || [];
}
