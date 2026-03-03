import * as Yup from "yup"

const VALID_EVENTS = [
  "message_created",
  "conversation_created",
  "conversation_status_changed",
  "contact_created",
  "*"
]

export const createWebhookSchema = Yup.object().shape({
  url: Yup.string()
    .url("URL invalida")
    .required("URL e obrigatoria"),
  events: Yup.array()
    .of(
      Yup.string()
        .oneOf(VALID_EVENTS, "Evento invalido")
        .required()
    )
    .min(1, "Selecione pelo menos um evento")
    .required("Eventos sao obrigatorios"),
  secret: Yup.string().optional(),
  isActive: Yup.boolean().optional()
})

export const updateWebhookSchema = Yup.object().shape({
  url: Yup.string()
    .url("URL invalida")
    .optional(),
  events: Yup.array()
    .of(
      Yup.string()
        .oneOf(VALID_EVENTS, "Evento invalido")
        .required()
    )
    .min(1, "Selecione pelo menos um evento")
    .optional(),
  secret: Yup.string().optional(),
  isActive: Yup.boolean().optional()
})
