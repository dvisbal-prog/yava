import React from "react";
import { Redirect } from "expo-router";

/** /(auth) no tiene pantalla propia: 01 · Apertura vive en la entrada (`app/index.tsx`) y el acceso (02) en login. */
export default function AuthIndex() {
  return <Redirect href="/(auth)/login" />;
}
