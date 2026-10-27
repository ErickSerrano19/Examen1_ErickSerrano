import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/**
 * Formulario de registro de equipos.
 *
 * iniciarFormulario({ alGuardar }):
 *  1. Llene el <select id="categoria_id"> con listarCategorias()
 *     (cree cada <option> con createElement, value = id, texto = nombre).
 *  2. Al enviar el formulario (submit):
 *     - Evite el envío tradicional.
 *     - Limpie los errores anteriores: textContent de [data-error] y aria-invalid de los campos.
 *     - Construya el objeto con FormData. categoria_id y costo_interno deben ir como números.
 *     - Deshabilite #btn-guardar y cambie su texto a "Guardando…" mientras espera.
 *     - Llame a crearEquipo(datos).
 *     - Éxito: limpie el formulario, mostrarMensaje("exito", "Equipo <codigo> registrado.")
 *              y llame a alGuardar().
 *     - 422: por cada campo de error.datos.errors, escriba el PRIMER mensaje en
 *            el <p data-error="<campo>"> y marque el campo con aria-invalid="true".
 *     - Otro error: mostrarMensaje("error", ...).
 *     - Siempre (finally): rehabilite el botón y restaure su texto.
 */
export const iniciarFormulario = ({ alGuardar }) => {
  const textoBoton = $btnGuardar.textContent;

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    $form.querySelectorAll("[data-error]").forEach(($error) => {
      $error.textContent = "";
    });
    $form.querySelectorAll("[aria-invalid]").forEach(($campo) => {
      $campo.removeAttribute("aria-invalid");
    });

    const formData = new FormData($form);
    const datos = Object.fromEntries(formData.entries());
    datos.categoria_id = Number(datos.categoria_id);
    datos.costo_interno = Number(datos.costo_interno);

    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const equipo = await crearEquipo(datos);

      $form.reset();
      mostrarMensaje("exito", `Equipo ${equipo.data.codigo} registrado.`);
      await alGuardar();
    } catch (error) {
      if (error.status === 422) {
        Object.entries(error.datos.errors ?? {}).forEach(([campo, mensajes]) => {
          const $mensaje = Array.from($form.querySelectorAll("[data-error]"))
            .find(($elemento) => $elemento.dataset.error === campo);
          const $campo = $form.elements.namedItem(campo);

          if ($mensaje && $campo instanceof HTMLElement) {
            $mensaje.textContent = mensajes[0];
            $campo.setAttribute("aria-invalid", "true");
          }
        });
      } else {
        mostrarMensaje("error", error.message);
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoBoton;
    }
  });

  listarCategorias()
    .then(({ data }) => {
      data.forEach((categoria) => {
        const opcion = document.createElement("option");
        opcion.value = categoria.id;
        opcion.textContent = categoria.nombre;
        $selectCategoria.append(opcion);
      });
    })
    .catch((error) => mostrarMensaje("error", error.message));
};
