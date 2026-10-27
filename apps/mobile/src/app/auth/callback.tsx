import React from "react";
import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";

// Regreso del OAuth de Google (yava://auth/callback y popup en web). En web esto entrega la URL
// a la ventana que abrió el popup y lo cierra; en nativo la sesión ya la procesa signInWithGoogle.
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  // Invitados y clientes pueden estar en (customer); el AuthGate mueve a los demás roles a su grupo.
  return <Redirect href="/(customer)" />;
}
