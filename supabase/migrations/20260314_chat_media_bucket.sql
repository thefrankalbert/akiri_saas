-- Storage bucket for chat media (images shared in conversations)

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can read chat media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-media');
