type StripHtmlProps = {
  html: string;
};

export default function StripHtml({ html }: StripHtmlProps) {
  const plainText = html.replace(/<[^>]*>?/gm, '');
  return <span>{plainText}</span>;
}
