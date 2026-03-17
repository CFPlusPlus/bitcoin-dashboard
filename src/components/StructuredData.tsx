type StructuredDataProps = {
  data: string;
};

export default function StructuredData({ data }: StructuredDataProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: data }} />;
}
