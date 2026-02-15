import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

const SEOHead = ({ title, description, image, url }: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    const updateMeta = (property: string, content: string) => {
      const meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      }
    };

    const updateTwitterMeta = (name: string, content: string) => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      }
    };

    const baseUrl = "https://ganhostempolivre.lovable.app";
    const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
    const imageUrl = image ? `${baseUrl}${image}` : `${baseUrl}/og-image.png`;

    updateMeta("og:title", title);
    updateMeta("og:description", description);
    updateMeta("og:url", fullUrl);
    updateMeta("og:image", imageUrl);

    updateTwitterMeta("twitter:title", title);
    updateTwitterMeta("twitter:description", description);
    updateTwitterMeta("twitter:image", imageUrl);

    return () => {
      document.title = "Ganhos Tempo Livre";
      if (metaDescription) {
        metaDescription.setAttribute("content", "");
      }
    };
  }, [title, description, image, url]);

  return null;
};

export default SEOHead;
