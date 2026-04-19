// Script to add platformAgents translations to all locale JSON files
// Run with: node scripts/add-platform-agents.js

const fs = require('fs')
const path = require('path')

const messagesDir = path.join(__dirname, '..', 'src', 'messages')

const platformAgents = {
  en: {
    "content-engine": {
      name: "Content Engine",
      shortDescription: "Transform voice notes, photos, and videos into professional social media content, patient education materials, and marketing copy.",
      description: "Content Engine is your AI-powered marketing assistant built for rehab professionals. Drop in a voice memo from your car, a quick video of a patient exercise, or a photo from the clinic — and Content Engine turns it into polished Instagram captions, patient handouts, newsletter sections, and more. It understands rehab terminology, speaks your specialty, and keeps your brand consistent across every platform. Stop spending evenings writing content. Let Content Engine handle the words while you handle the patients."
    },
    "ce-matcher": {
      name: "CE Matcher",
      shortDescription: "Find the perfect continuing education courses matched to your specialty, license requirements, location, and budget.",
      description: "CE Matcher eliminates the hours you spend searching for continuing education that actually fits your life. Tell it your license state, renewal deadline, specialty focus, budget, and preferred format — live, online, or hybrid — and it surfaces the best-matched courses from hundreds of providers. It tracks your CE credits, alerts you when renewal windows open, and even suggests course sequences that build toward advanced certifications. Never scramble for last-minute CE again."
    },
    "course-creator": {
      name: "Course Creator",
      shortDescription: "Turn your clinical expertise into a structured online course with AI-guided curriculum design, slide decks, and assessment questions.",
      description: "Course Creator helps rehab professionals monetize their expertise by building professional online courses in a fraction of the time. Describe your clinical knowledge area, your target audience, and your learning objectives — Course Creator generates a full curriculum outline, lesson scripts, slide deck structure, quiz questions, and even a suggested pricing strategy. Whether you want to sell on your own site or list on a major platform, Course Creator gives you the scaffolding to go from expert to educator without starting from a blank page."
    }
  },
  es: {
    "content-engine": {
      name: "Content Engine",
      shortDescription: "Transforma notas de voz, fotos y videos en contenido profesional para redes sociales, materiales de educación para pacientes y textos de marketing.",
      description: "Content Engine es tu asistente de marketing impulsado por IA, diseñado para profesionales de la rehabilitación. Envía una nota de voz desde el coche, un video rápido de un ejercicio o una foto de la clínica, y Content Engine lo convierte en publicaciones pulidas para Instagram, folletos para pacientes, secciones de boletines y mucho más. Comprende la terminología de rehabilitación, habla tu especialidad y mantiene la coherencia de tu marca en todas las plataformas. Deja de pasar las noches escribiendo contenido y enfócate en tus pacientes."
    },
    "ce-matcher": {
      name: "CE Matcher",
      shortDescription: "Encuentra los cursos de educación continua perfectos, adaptados a tu especialidad, requisitos de licencia, ubicación y presupuesto.",
      description: "CE Matcher elimina las horas que pasas buscando educación continua que realmente se adapte a tu vida. Indícale el estado de tu licencia, la fecha límite de renovación, el área de especialidad, el presupuesto y el formato preferido (presencial, en línea o híbrido), y te mostrará los cursos más adecuados de cientos de proveedores. Realiza un seguimiento de tus créditos de educación continua, te avisa cuando se abren los períodos de renovación y sugiere secuencias de cursos para avanzar hacia certificaciones avanzadas. Nunca más busques cursos de última hora."
    },
    "course-creator": {
      name: "Course Creator",
      shortDescription: "Convierte tu experiencia clínica en un curso en línea estructurado con diseño curricular guiado por IA, presentaciones y preguntas de evaluación.",
      description: "Course Creator ayuda a los profesionales de la rehabilitación a monetizar su experiencia creando cursos en línea profesionales en una fracción del tiempo. Describe tu área de conocimiento clínico, tu público objetivo y tus objetivos de aprendizaje, y Course Creator genera un esquema curricular completo, guiones de lecciones, estructura de diapositivas, preguntas de evaluación e incluso una estrategia de precios sugerida. Ya sea que quieras vender en tu propio sitio o publicar en una plataforma importante, Course Creator te da la estructura para pasar de experto a educador sin empezar desde cero."
    }
  },
  pt: {
    "content-engine": {
      name: "Content Engine",
      shortDescription: "Transforme notas de voz, fotos e vídeos em conteúdo profissional para redes sociais, materiais educativos para pacientes e textos de marketing.",
      description: "Content Engine é o seu assistente de marketing com IA, criado para profissionais de reabilitação. Envie uma nota de voz do carro, um vídeo rápido de um exercício ou uma foto da clínica, e o Content Engine transforma tudo em legendas polidas para o Instagram, folhetos para pacientes, seções de boletins e muito mais. Ele entende a terminologia de reabilitação, fala a sua especialidade e mantém a consistência da sua marca em todas as plataformas. Pare de passar as noites escrevendo conteúdo e foque nos seus pacientes."
    },
    "ce-matcher": {
      name: "CE Matcher",
      shortDescription: "Encontre os cursos de educação continuada perfeitos, adaptados à sua especialidade, requisitos de licença, localização e orçamento.",
      description: "CE Matcher elimina as horas que você passa procurando educação continuada que realmente se encaixa na sua vida. Informe o estado da sua licença, prazo de renovação, área de especialidade, orçamento e formato preferido (presencial, online ou híbrido), e ele exibe os cursos mais adequados de centenas de provedores. Acompanha seus créditos de educação continuada, avisa quando os períodos de renovação se abrem e sugere sequências de cursos para avançar em direção a certificações avançadas. Nunca mais corra atrás de cursos de última hora."
    },
    "course-creator": {
      name: "Course Creator",
      shortDescription: "Transforme sua experiência clínica em um curso online estruturado com design curricular guiado por IA, apresentações e questões de avaliação.",
      description: "Course Creator ajuda profissionais de reabilitação a monetizar sua expertise criando cursos online profissionais em uma fração do tempo. Descreva sua área de conhecimento clínico, seu público-alvo e seus objetivos de aprendizagem, e o Course Creator gera um currículo completo, roteiros de aulas, estrutura de slides, questões de avaliação e até uma estratégia de precificação sugerida. Seja para vender no seu próprio site ou publicar em uma plataforma conhecida, o Course Creator oferece a estrutura para você ir de especialista a educador sem começar do zero."
    }
  },
  fr: {
    "content-engine": {
      name: "Content Engine",
      shortDescription: "Transformez vos notes vocales, photos et vidéos en contenu professionnel pour les réseaux sociaux, des supports éducatifs pour les patients et des textes marketing.",
      description: "Content Engine est votre assistant marketing propulsé par l'IA, conçu pour les professionnels de la rééducation. Déposez un mémo vocal enregistré en voiture, une courte vidéo d'exercice ou une photo de la clinique, et Content Engine les transforme en légendes Instagram soignées, brochures pour patients, sections de newsletters, et bien plus encore. Il maîtrise la terminologie de la rééducation, parle votre spécialité et maintient la cohérence de votre image de marque sur toutes les plateformes. Arrêtez de passer vos soirées à rédiger du contenu et concentrez-vous sur vos patients."
    },
    "ce-matcher": {
      name: "CE Matcher",
      shortDescription: "Trouvez les formations continues parfaites, adaptées à votre spécialité, aux exigences de votre licence, à votre lieu de résidence et à votre budget.",
      description: "CE Matcher élimine les heures que vous passez à chercher des formations continues qui correspondent réellement à votre vie. Indiquez-lui l'état de votre licence, la date limite de renouvellement, votre domaine de spécialité, votre budget et le format souhaité (présentiel, en ligne ou hybride), et il affiche les formations les plus adaptées parmi des centaines de prestataires. Il suit vos crédits de formation continue, vous alerte à l'ouverture des périodes de renouvellement et suggère même des parcours de formation menant à des certifications avancées. Ne cherchez plus jamais des formations à la dernière minute."
    },
    "course-creator": {
      name: "Course Creator",
      shortDescription: "Transformez votre expertise clinique en une formation en ligne structurée grâce à la conception pédagogique guidée par l'IA, des diaporamas et des questions d'évaluation.",
      description: "Course Creator aide les professionnels de la rééducation à valoriser leur expertise en créant des formations en ligne professionnelles en un temps record. Décrivez votre domaine de connaissance clinique, votre public cible et vos objectifs pédagogiques, et Course Creator génère un plan de cours complet, des scripts de leçons, une structure de diaporamas, des questions d'évaluation et même une stratégie tarifaire suggérée. Que vous souhaitiez vendre sur votre propre site ou publier sur une grande plateforme, Course Creator vous donne la structure pour passer d'expert à formateur sans partir d'une page blanche."
    }
  },
  de: {
    "content-engine": {
      name: "Content Engine",
      shortDescription: "Verwandeln Sie Sprachnotizen, Fotos und Videos in professionelle Social-Media-Inhalte, Patientenedukationsmaterialien und Marketingtexte.",
      description: "Content Engine ist Ihr KI-gestützter Marketing-Assistent für Rehabilitationsfachleute. Laden Sie eine Sprachnotiz aus dem Auto, ein kurzes Übungsvideo oder ein Foto aus der Klinik hoch, und Content Engine verwandelt es in polierte Instagram-Bildunterschriften, Patientenbroschüren, Newsletter-Abschnitte und vieles mehr. Es versteht die Fachterminologie der Rehabilitation, spricht Ihre Spezialisierung und sorgt für eine einheitliche Markendarstellung auf allen Plattformen. Hören Sie auf, Abende mit dem Schreiben von Inhalten zu verbringen, und kümmern Sie sich um Ihre Patienten."
    },
    "ce-matcher": {
      name: "CE Matcher",
      shortDescription: "Finden Sie die perfekten Fortbildungskurse, die zu Ihrer Fachrichtung, Ihren Lizenzanforderungen, Ihrem Standort und Ihrem Budget passen.",
      description: "CE Matcher eliminiert die Stunden, die Sie mit der Suche nach Fortbildungen verbringen, die wirklich zu Ihrem Leben passen. Geben Sie Ihren Lizenzstaat, den Erneuerungstermin, Ihren Fachschwerpunkt, Ihr Budget und das bevorzugte Format (Präsenz, online oder hybrid) an, und es zeigt Ihnen die am besten geeigneten Kurse aus Hunderten von Anbietern. Es verfolgt Ihre Fortbildungspunkte, benachrichtigt Sie, wenn Verlängerungszeiträume beginnen, und schlägt sogar Kurssequenzen vor, die zu erweiterten Zertifizierungen führen. Suchen Sie nie wieder in letzter Minute nach Fortbildungen."
    },
    "course-creator": {
      name: "Course Creator",
      shortDescription: "Verwandeln Sie Ihr klinisches Fachwissen in einen strukturierten Online-Kurs mit KI-gesteuertem Curriculum-Design, Präsentationsfolien und Prüfungsfragen.",
      description: "Course Creator hilft Rehabilitationsfachleuten, ihr Fachwissen zu monetarisieren, indem sie in einem Bruchteil der Zeit professionelle Online-Kurse erstellen. Beschreiben Sie Ihr klinisches Wissensgebiet, Ihre Zielgruppe und Ihre Lernziele, und Course Creator generiert eine vollständige Lehrplanübersicht, Unterrichtsskripte, eine Folienstruktur, Quizfragen und sogar eine empfohlene Preisstrategie. Ob Sie auf Ihrer eigenen Website verkaufen oder auf einer großen Plattform veröffentlichen möchten, Course Creator gibt Ihnen das Gerüst, um ohne leere Seite vom Experten zum Kursleiter zu werden."
    }
  },
  ar: {
    "content-engine": {
      name: "Content Engine",
      shortDescription: "حوّل ملاحظاتك الصوتية والصور ومقاطع الفيديو إلى محتوى احترافي لوسائل التواصل الاجتماعي ومواد تثقيف المرضى ونصوص التسويق.",
      description: "Content Engine هو مساعدك التسويقي المدعوم بالذكاء الاصطناعي، مصمم خصيصًا للمختصين في إعادة التأهيل. أرسل مذكرة صوتية من سيارتك، أو مقطع فيديو سريع لتمرين، أو صورة من العيادة، وسيحوّلها Content Engine إلى تعليقات احترافية على إنستغرام، ونشرات للمرضى، وأقسام نشرات إخبارية، والمزيد. يفهم مصطلحات إعادة التأهيل، ويتحدث بلغة تخصصك، ويحافظ على اتساق علامتك التجارية عبر جميع المنصات. توقف عن قضاء أمسياتك في كتابة المحتوى، وركّز على مرضاك."
    },
    "ce-matcher": {
      name: "CE Matcher",
      shortDescription: "ابحث عن دورات التعليم المستمر المثالية المتوافقة مع تخصصك ومتطلبات ترخيصك وموقعك وميزانيتك.",
      description: "يُلغي CE Matcher الساعات التي تقضيها في البحث عن تعليم مستمر يتناسب فعلًا مع حياتك. أخبره بولاية ترخيصك وموعد التجديد وتخصصك والميزانية والصيغة المفضلة (حضوري أو إلكتروني أو هجين)، وسيعرض لك الدورات الأنسب من بين مئات مزودي التدريب. يتتبع نقاط تعليمك المستمر، ويُنبهك حين تفتح نوافذ التجديد، ويقترح تسلسلات دورات تقودك نحو شهادات متقدمة. لن تضطر مجددًا للبحث عن دورات في اللحظة الأخيرة."
    },
    "course-creator": {
      name: "Course Creator",
      shortDescription: "حوّل خبرتك السريرية إلى دورة تدريبية إلكترونية منظمة بمساعدة الذكاء الاصطناعي في تصميم المنهج وشرائح العرض وأسئلة التقييم.",
      description: "يساعد Course Creator المختصين في إعادة التأهيل على تحقيق الدخل من خبراتهم عبر بناء دورات إلكترونية احترافية في وقت قصير جدًا. صف مجال معرفتك السريرية وجمهورك المستهدف وأهدافك التعليمية، وسيُولّد Course Creator مخططًا كاملًا للمنهج، ونصوص الدروس، وهيكل الشرائح، وأسئلة الاختبارات، وحتى استراتيجية تسعير مقترحة. سواء كنت تريد البيع على موقعك الخاص أو النشر على منصة كبرى، يوفر لك Course Creator البنية الأساسية للانتقال من خبير إلى معلم دون الحاجة للبدء من صفحة فارغة."
    }
  }
}

const locales = ['en', 'es', 'pt', 'fr', 'de', 'ar']

for (const locale of locales) {
  const filePath = path.join(messagesDir, `${locale}.json`)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)

  // Add platformAgents block
  data.platformAgents = platformAgents[locale]

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`Updated ${locale}.json`)
}

console.log('Done!')
