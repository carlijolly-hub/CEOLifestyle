import React from "react";
import { ContactSupplierDirectoryManager } from "./ContactSupplierDirectoryManager";
import { ContactRecord } from "../types";

interface ContactDirectoryManagerProps {
  contacts?: ContactRecord[];
  onUpdateContacts?: (updatedContacts: ContactRecord[]) => void;
}

export function ContactDirectoryManager({ contacts, onUpdateContacts }: ContactDirectoryManagerProps) {
  return (
    <ContactSupplierDirectoryManager
      contacts={contacts}
      onUpdateContacts={onUpdateContacts}
    />
  );
}
