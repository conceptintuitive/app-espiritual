// lib/testeSeuDiaChave.js — só a chave do teste de 7 dias do Seu Dia Completo,
// num arquivo sem import nenhum: a home (quiz) usa sem levar lib/sky.js junto.
// O resto do calendário do teste mora em lib/testeSeuDia.js (que reexporta isto).

// Chave única do teste: o cadastro da Minha Área (e o checkbox do quiz) só dá
// os 7 dias se estiver ligada, e o /assinar só oferece "teste 7 dias grátis" se
// estiver ligada.
export const TESTE_SEU_DIA_ATIVO = true;
