import React from "react";
import { PersonalDataForm } from "@/components/customer/screens/PersonalDataForm";
/** Pantalla 05 (ruta para usuarios con sesión: el AuthGate no permite (auth) con sesión activa). */
export default function CustomerPersonalData() { return <PersonalDataForm group="customer" />; }
