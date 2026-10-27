import React from "react";
import { Redirect } from "expo-router";

/** /(auth) no tiene pantalla propia: 01 es el splash nativo y el acceso (02) vive en login. */
export default function AuthIndex() {
  return <Redirect href="/(auth)/login" />;
}
