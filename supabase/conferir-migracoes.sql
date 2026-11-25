-- Confere, no banco, o que cada migração de supabase/migrations/ criou.
-- Cole tudo no SQL Editor do Supabase e rode. Só LÊ, não muda nada.
-- Resultado: uma linha por migração, "completa" ou o que falta nela.
-- Migração nova = acrescentar as linhas dela no VALUES abaixo.
--
-- tipo: tabela | coluna | view | indice | rls (RLS ligado) | enum | regra
--       (texto dentro de uma CHECK constraint) | bucket (Storage público) |
--       mime (tipo de arquivo que o bucket aceita)

with esperado(migracao, tipo, tabela, item) as (
  values
  -- 0001
  ('0001_reminder_tracking', 'coluna', 'analises', 'created_at'),
  ('0001_reminder_tracking', 'coluna', 'analises', 'reminder_1h_sent_at'),
  ('0001_reminder_tracking', 'coluna', 'analises', 'reminder_24h_sent_at'),
  -- 0002
  ('0002_chat_mensagens', 'tabela', 'chat_mensagens', null),
  ('0002_chat_mensagens', 'coluna', 'chat_mensagens', 'id'),
  ('0002_chat_mensagens', 'coluna', 'chat_mensagens', 'analise_id'),
  ('0002_chat_mensagens', 'coluna', 'chat_mensagens', 'role'),
  ('0002_chat_mensagens', 'coluna', 'chat_mensagens', 'content'),
  ('0002_chat_mensagens', 'coluna', 'chat_mensagens', 'created_at'),
  ('0002_chat_mensagens', 'indice', 'chat_mensagens', 'chat_mensagens_analise_id_idx'),
  ('0002_chat_mensagens', 'indice', 'chat_mensagens', 'chat_mensagens_analise_id_created_at_idx'),
  -- 0003
  ('0003_tier2_projecao12meses', 'coluna', 'analises', 'tier2_payment_status'),
  ('0003_tier2_projecao12meses', 'coluna', 'analises', 'tier2_mp_payment_id'),
  ('0003_tier2_projecao12meses', 'coluna', 'analises', 'tier2_mp_preference_id'),
  ('0003_tier2_projecao12meses', 'coluna', 'analises', 'tier2_paid_at'),
  ('0003_tier2_projecao12meses', 'coluna', 'analises', 'tier2_pessoa2_nome'),
  ('0003_tier2_projecao12meses', 'coluna', 'analises', 'tier2_pessoa2_data_nascimento'),
  -- 0004
  ('0004_human_design', 'coluna', 'analises', 'hd_payment_status'),
  ('0004_human_design', 'coluna', 'analises', 'hd_mp_payment_id'),
  ('0004_human_design', 'coluna', 'analises', 'hd_mp_preference_id'),
  ('0004_human_design', 'coluna', 'analises', 'hd_paid_at'),
  -- 0005
  ('0005_compatibilidade_completa', 'coluna', 'analises', 'compat_payment_status'),
  ('0005_compatibilidade_completa', 'coluna', 'analises', 'compat_mp_payment_id'),
  ('0005_compatibilidade_completa', 'coluna', 'analises', 'compat_mp_preference_id'),
  ('0005_compatibilidade_completa', 'coluna', 'analises', 'compat_paid_at'),
  ('0005_compatibilidade_completa', 'coluna', 'analises', 'compat_pessoa2_nome'),
  ('0005_compatibilidade_completa', 'coluna', 'analises', 'compat_pessoa2_data_nascimento'),
  -- 0006 a 0008
  ('0006_mes_pessoal_email', 'coluna', 'analises', 'tier2_ultimo_email_mes'),
  ('0007_presente', 'coluna', 'analises', 'presente_email'),
  ('0007_presente', 'coluna', 'analises', 'presente_de'),
  ('0008_lead_nurture_semanal', 'coluna', 'analises', 'unsubscribed'),
  ('0008_lead_nurture_semanal', 'coluna', 'analises', 'lead_ultima_semana_email'),
  -- 0009
  ('0009_leads_parciais', 'tabela', 'leads_parciais', null),
  ('0009_leads_parciais', 'coluna', 'leads_parciais', 'id'),
  ('0009_leads_parciais', 'coluna', 'leads_parciais', 'email'),
  ('0009_leads_parciais', 'coluna', 'leads_parciais', 'nome'),
  ('0009_leads_parciais', 'coluna', 'leads_parciais', 'created_at'),
  ('0009_leads_parciais', 'coluna', 'leads_parciais', 'updated_at'),
  ('0009_leads_parciais', 'indice', 'leads_parciais', 'leads_parciais_email_key'),
  ('0009_leads_parciais', 'rls', 'leads_parciais', null),
  -- 0010
  ('0010_tiktok_oauth_tokens', 'tabela', 'tiktok_oauth_tokens', null),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'id'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'open_id'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'access_token'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'refresh_token'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'scope'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'token_type'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'expires_at'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'refresh_expires_at'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'created_at'),
  ('0010_tiktok_oauth_tokens', 'coluna', 'tiktok_oauth_tokens', 'updated_at'),
  ('0010_tiktok_oauth_tokens', 'indice', 'tiktok_oauth_tokens', 'tiktok_oauth_tokens_open_id_key'),
  ('0010_tiktok_oauth_tokens', 'rls', 'tiktok_oauth_tokens', null),
  -- 0011
  ('0011_tiktok_publishes', 'tabela', 'tiktok_publishes', null),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'id'),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'publish_id'),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'video_url'),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'caption'),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'status'),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'status_detail'),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'created_at'),
  ('0011_tiktok_publishes', 'coluna', 'tiktok_publishes', 'updated_at'),
  ('0011_tiktok_publishes', 'indice', 'tiktok_publishes', 'tiktok_publishes_publish_id_key'),
  ('0011_tiktok_publishes', 'rls', 'tiktok_publishes', null),
  -- 0012
  ('0012_manual_feedback', 'enum', 'feedback_resposta', null),
  ('0012_manual_feedback', 'tabela', 'manual_feedback', null),
  ('0012_manual_feedback', 'coluna', 'manual_feedback', 'id'),
  ('0012_manual_feedback', 'coluna', 'manual_feedback', 'manual_id'),
  ('0012_manual_feedback', 'coluna', 'manual_feedback', 'secao'),
  ('0012_manual_feedback', 'coluna', 'manual_feedback', 'resposta'),
  ('0012_manual_feedback', 'coluna', 'manual_feedback', 'created_at'),
  ('0012_manual_feedback', 'indice', 'manual_feedback', 'manual_feedback_manual_secao_key'),
  ('0012_manual_feedback', 'rls', 'manual_feedback', null),
  -- 0013 a 0016
  ('0013_valor_pago_origem', 'coluna', 'analises', 'valor_pago'),
  ('0013_valor_pago_origem', 'coluna', 'analises', 'origem'),
  ('0014_processado_em', 'coluna', 'analises', 'processado_em'),
  ('0015_municipio_fuso', 'coluna', 'analises', 'municipio_ibge'),
  ('0015_municipio_fuso', 'coluna', 'analises', 'fuso_iana'),
  ('0016_utc_offset_nascimento', 'coluna', 'analises', 'utc_offset_nascimento'),
  -- 0017
  ('0017_seu_dia', 'tabela', 'seu_dia_perfis', null),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'email'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'nome'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'data_nascimento'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'hora_nascimento'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'cidade_nome'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'cidade_uf'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'municipio_ibge'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'latitude'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'longitude'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'fuso_iana'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'criado_em'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'link_enviado_em'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'verificado_em'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'teste_inicio'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'ultimo_acesso'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'lista_espera_em'),
  ('0017_seu_dia', 'coluna', 'seu_dia_perfis', 'lista_espera_plano'),
  ('0017_seu_dia', 'rls', 'seu_dia_perfis', null),
  ('0017_seu_dia', 'tabela', 'seu_dia_visitas', null),
  ('0017_seu_dia', 'coluna', 'seu_dia_visitas', 'email'),
  ('0017_seu_dia', 'coluna', 'seu_dia_visitas', 'dia'),
  ('0017_seu_dia', 'rls', 'seu_dia_visitas', null),
  ('0017_seu_dia', 'tabela', 'seu_dia_push', null),
  ('0017_seu_dia', 'coluna', 'seu_dia_push', 'endpoint'),
  ('0017_seu_dia', 'coluna', 'seu_dia_push', 'email'),
  ('0017_seu_dia', 'coluna', 'seu_dia_push', 'p256dh'),
  ('0017_seu_dia', 'coluna', 'seu_dia_push', 'auth'),
  ('0017_seu_dia', 'coluna', 'seu_dia_push', 'criado_em'),
  ('0017_seu_dia', 'indice', 'seu_dia_push', 'seu_dia_push_email_idx'),
  ('0017_seu_dia', 'rls', 'seu_dia_push', null),
  ('0017_seu_dia', 'view', 'seu_dia_metricas', null),
  -- 0018
  ('0018_assinaturas', 'tabela', 'assinaturas', null),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'id'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'email'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'plano'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'metodo'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'status'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'acesso_ate'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'mp_preapproval_id'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'ultimo_mp_payment_id'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'valor'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'origem'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'lembrete_enviado_em'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'criado_em'),
  ('0018_assinaturas', 'coluna', 'assinaturas', 'atualizado_em'),
  ('0018_assinaturas', 'indice', 'assinaturas', 'assinaturas_email_idx'),
  ('0018_assinaturas', 'indice', 'assinaturas', 'assinaturas_acesso_idx'),
  ('0018_assinaturas', 'rls', 'assinaturas', null),
  ('0018_assinaturas', 'tabela', 'assinatura_pagamentos', null),
  ('0018_assinaturas', 'coluna', 'assinatura_pagamentos', 'mp_payment_id'),
  ('0018_assinaturas', 'coluna', 'assinatura_pagamentos', 'assinatura_id'),
  ('0018_assinaturas', 'coluna', 'assinatura_pagamentos', 'valor'),
  ('0018_assinaturas', 'coluna', 'assinatura_pagamentos', 'criado_em'),
  ('0018_assinaturas', 'rls', 'assinatura_pagamentos', null),
  ('0018_assinaturas', 'view', 'assinatura_metricas', null),
  -- 0019 a 0023
  ('0019_seu_dia_codigo', 'coluna', 'seu_dia_perfis', 'codigo_hash'),
  ('0019_seu_dia_codigo', 'coluna', 'seu_dia_perfis', 'codigo_expira'),
  ('0019_seu_dia_codigo', 'coluna', 'seu_dia_perfis', 'codigo_tentativas'),
  ('0020_leituras_ocultas', 'coluna', 'seu_dia_perfis', 'leituras_ocultas'),
  ('0021_perfil_confirmado', 'coluna', 'seu_dia_perfis', 'perfil_confirmado_em'),
  ('0022_seu_dia_email_teste', 'coluna', 'seu_dia_perfis', 'email_diario'),
  ('0022_seu_dia_email_teste', 'coluna', 'seu_dia_perfis', 'email_diario_ultimo'),
  ('0022_seu_dia_email_teste', 'coluna', 'seu_dia_perfis', 'email_teste_d5_em'),
  ('0022_seu_dia_email_teste', 'coluna', 'seu_dia_perfis', 'email_teste_d7_em'),
  ('0022_seu_dia_email_teste', 'view', 'seu_dia_teste_metricas', null),
  ('0022_seu_dia_email_teste', 'view', 'seu_dia_teste_resumo', null),
  ('0023_atribuicao', 'coluna', 'analises', 'atribuicao'),
  ('0023_atribuicao', 'indice', 'analises', 'analises_paid_at_idx'),
  -- 0024
  ('0024_social_automacao', 'tabela', 'social_posts', null),
  ('0024_social_automacao', 'coluna', 'social_posts', 'id'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'data'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'rede'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'tipo'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'tema'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'serie'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'indice'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'item'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'status'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'post_id'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'erro'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'tentativas'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'created_at'),
  ('0024_social_automacao', 'coluna', 'social_posts', 'updated_at'),
  ('0024_social_automacao', 'indice', 'social_posts', 'social_posts_data_rede_tipo_key'),
  ('0024_social_automacao', 'indice', 'social_posts', 'social_posts_data_idx'),
  ('0024_social_automacao', 'rls', 'social_posts', null),
  ('0024_social_automacao', 'tabela', 'social_series', null),
  ('0024_social_automacao', 'coluna', 'social_series', 'serie'),
  ('0024_social_automacao', 'coluna', 'social_series', 'proximo'),
  ('0024_social_automacao', 'coluna', 'social_series', 'updated_at'),
  ('0024_social_automacao', 'rls', 'social_series', null),
  ('0024_social_automacao', 'tabela', 'social_tokens', null),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'rede'),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'access_token'),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'expires_at'),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'env_hash'),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'renovado_em'),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'tentou_em'),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'ultimo_erro'),
  ('0024_social_automacao', 'coluna', 'social_tokens', 'updated_at'),
  ('0024_social_automacao', 'rls', 'social_tokens', null),
  -- 0025
  ('0025_social_conteudo_reels_comentarios', 'tabela', 'social_conteudos', null),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'data'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'tema'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'serie'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'indice'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'item'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'conteudo'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'fonte'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'revisao'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'versao'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'gerado_em'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_conteudos', 'tiktok_aprovacao'),
  ('0025_social_conteudo_reels_comentarios', 'rls', 'social_conteudos', null),
  ('0025_social_conteudo_reels_comentarios', 'regra', 'social_posts', 'social_posts_tipo_check:reels'),
  ('0025_social_conteudo_reels_comentarios', 'regra', 'social_posts', 'social_posts_status_check:aguardando'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_posts', 'etapa'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_posts', 'externo_id'),
  ('0025_social_conteudo_reels_comentarios', 'tabela', 'social_respostas', null),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_respostas', 'comentario_id'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_respostas', 'modelo'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_respostas', 'respondido_em'),
  ('0025_social_conteudo_reels_comentarios', 'rls', 'social_respostas', null),
  ('0025_social_conteudo_reels_comentarios', 'tabela', 'social_alertas', null),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_alertas', 'chave'),
  ('0025_social_conteudo_reels_comentarios', 'coluna', 'social_alertas', 'ultimo'),
  ('0025_social_conteudo_reels_comentarios', 'rls', 'social_alertas', null),
  -- 0026
  ('0026_reels_storage', 'bucket', 'reels', null),
  -- 0027
  ('0027_conversao_resultado', 'tabela', 'manual_avaliacoes', null),
  ('0027_conversao_resultado', 'coluna', 'manual_avaliacoes', 'analise_id'),
  ('0027_conversao_resultado', 'coluna', 'manual_avaliacoes', 'resposta'),
  ('0027_conversao_resultado', 'coluna', 'manual_avaliacoes', 'frase'),
  ('0027_conversao_resultado', 'coluna', 'manual_avaliacoes', 'autoriza_publicar'),
  ('0027_conversao_resultado', 'coluna', 'manual_avaliacoes', 'oculto'),
  ('0027_conversao_resultado', 'coluna', 'manual_avaliacoes', 'criado_em'),
  ('0027_conversao_resultado', 'coluna', 'manual_avaliacoes', 'atualizado_em'),
  ('0027_conversao_resultado', 'rls', 'manual_avaliacoes', null),
  ('0027_conversao_resultado', 'coluna', 'analises', 'avaliacao_email_em'),
  ('0027_conversao_resultado', 'coluna', 'seu_dia_perfis', 'cadastro_quiz_em'),
  -- 0028
  ('0028_reels_narrado', 'tabela', 'social_reels_narrados', null),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'data'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'tema'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'roteiro'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'fonte'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'revisao'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'texto'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'audio_caminho'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'palavras'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'duracao'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'gerado_em'),
  ('0028_reels_narrado', 'coluna', 'social_reels_narrados', 'narrado_em'),
  ('0028_reels_narrado', 'rls', 'social_reels_narrados', null),
  ('0028_reels_narrado', 'tabela', 'social_narracao_uso', null),
  ('0028_reels_narrado', 'coluna', 'social_narracao_uso', 'mes'),
  ('0028_reels_narrado', 'coluna', 'social_narracao_uso', 'caracteres'),
  ('0028_reels_narrado', 'indice', 'social_narracao_uso', 'social_narracao_uso_mes_idx'),
  ('0028_reels_narrado', 'rls', 'social_narracao_uso', null),
  ('0028_reels_narrado', 'mime', 'reels', 'audio/mpeg'),
  -- 0029
  ('0029_reels_interativo', 'tabela', 'social_reels_interativos', null),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'data'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'formato'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'roteiro'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'texto'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'segmentos'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'linha'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'gerado_em'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'narrado_em'),
  ('0029_reels_interativo', 'coluna', 'social_reels_interativos', 'publicado_em'),
  ('0029_reels_interativo', 'rls', 'social_reels_interativos', null),
  -- 0030
  ('0030_frase_do_dia', 'coluna', 'social_posts', 'formato'),
  -- 0031
  ('0031_utm_social', 'tabela', 'social_visitas', null),
  ('0031_utm_social', 'coluna', 'social_visitas', 'dia'),
  ('0031_utm_social', 'coluna', 'social_visitas', 'source'),
  ('0031_utm_social', 'coluna', 'social_visitas', 'medium'),
  ('0031_utm_social', 'coluna', 'social_visitas', 'campaign'),
  ('0031_utm_social', 'coluna', 'social_visitas', 'content'),
  ('0031_utm_social', 'indice', 'social_visitas', 'social_visitas_dia_idx'),
  ('0031_utm_social', 'rls', 'social_visitas', null),
  ('0031_utm_social', 'coluna', 'seu_dia_perfis', 'atribuicao')
),
conferido as (
  select e.*,
    case e.tipo
      when 'tabela' then exists (
        select 1 from information_schema.tables t
        where t.table_schema = 'public' and t.table_name = e.tabela and t.table_type = 'BASE TABLE')
      when 'coluna' then exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public' and c.table_name = e.tabela and c.column_name = e.item)
      when 'view' then exists (
        select 1 from information_schema.views v
        where v.table_schema = 'public' and v.table_name = e.tabela)
      when 'indice' then exists (
        select 1 from pg_indexes i
        where i.schemaname = 'public' and i.tablename = e.tabela and i.indexname = e.item)
      when 'rls' then exists (
        select 1 from pg_class k join pg_namespace n on n.oid = k.relnamespace
        where n.nspname = 'public' and k.relname = e.tabela and k.relrowsecurity)
      when 'enum' then exists (
        select 1 from pg_type y join pg_namespace n on n.oid = y.typnamespace
        where n.nspname = 'public' and y.typname = e.tabela and y.typtype = 'e')
      when 'regra' then exists (
        select 1 from pg_constraint k
        where k.conname = split_part(e.item, ':', 1)
          and k.conrelid = to_regclass('public.' || e.tabela)
          and pg_get_constraintdef(k.oid) like '%' || split_part(e.item, ':', 2) || '%')
      when 'bucket' then exists (
        select 1 from storage.buckets b where b.id = e.tabela and b.public)
      when 'mime' then exists (
        select 1 from storage.buckets b where b.id = e.tabela and e.item = any(b.allowed_mime_types))
    end as existe
  from esperado e
)
select
  migracao,
  case when bool_and(existe) then 'completa'
       when not bool_or(existe) then 'NÃO RODOU'
       else 'INCOMPLETA' end as situacao,
  count(*) filter (where not existe) as faltam,
  coalesce(string_agg(
    case when not existe then
      tipo || ' ' || tabela || coalesce('.' || split_part(item, ':', 1), '')
    end, ', ' order by tabela, item), '') as o_que_falta
from conferido
group by migracao
order by migracao;
