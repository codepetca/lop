"use client";

import { useState, useCallback } from "react";

/**
 * Hook for managing inline edit state
 * @param initialValue - initial value to edit
 * @param onSave - callback to save the value
 * @returns state and handlers for inline editing
 */
export function useInlineEdit(
  initialValue: string,
  onSave: (value: string) => Promise<void> | void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = useCallback(() => {
    setTempValue(initialValue);
    setIsEditing(true);
  }, [initialValue]);

  const cancel = useCallback(() => {
    setTempValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const save = useCallback(async () => {
    if (tempValue === initialValue) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(tempValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Save failed:", error);
      setTempValue(initialValue);
    } finally {
      setIsSaving(false);
    }
  }, [tempValue, initialValue, onSave]);

  return {
    isEditing,
    tempValue,
    isSaving,
    setTempValue,
    startEditing,
    cancel,
    save,
  };
}
