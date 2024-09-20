"use client"

import Image from "next/image"
import styles from "./user.module.css"
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import { useTheme } from "@/app/providers/ThemeProvider";
import { updateUser } from "@/lib/users";
import { useMutation } from '@tanstack/react-query';

export default function UserComponent({ user }) {
  const { theme, changePrimaryColor } = useTheme();
  const [color, setColor] = useColor(theme.primaryColor);

  const mutation = useMutation({
    mutationFn: (newColor) => updateUser(user.id, { color: newColor }),
    onMutate: (newColor) => {
      changePrimaryColor(newColor);
    },
    onError: (error) => {
      console.error("Failed to update user color:", error.message);
    },
    onSuccess: (data) => {
      console.log("User color updated successfully:", data);
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    mutation.mutate(color.hex);
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Image
          alt={user.name}
          src={user.image}
          width={100}
          height={100}
          style={{
            border: `solid 2px ${color.hex}`,
            borderRadius: '5px',
          }}
        />
        <h1>{user.name}</h1>
      </header>
      <section className={styles.userDetails}>
        <form onSubmit={handleSave} className={styles.userForm}>
          <div className={styles.colorPicker}>
            <h3>Theme Color</h3>
            <ColorPicker
              color={color}
              onChange={setColor}
            />
          </div>
          <button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving...' : 'Save'}
          </button>
        </form>
      </section>
    </main>
  );
}
