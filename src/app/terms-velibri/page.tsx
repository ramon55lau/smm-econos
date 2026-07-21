import Image from "next/image";
import styles from "./TermsOfService.module.css";

export default function TermsVelibriPage() {
    const lastUpdated = new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className={styles.container}>
            <div className={`glass-panel ${styles.content}`}>
                <div className={styles.logoHeader}>
                    <Image src="/images/logo-econos.png" alt="Econos" width={240} height={75} className={styles.logo} priority />
                    <div className={styles.headerDivider}></div>
                    <Image src="/images/logo-smm.png" alt="SMM" width={150} height={60} className={styles.logo} priority />
                </div>

                <h1 className={styles.title}>TÉRMINOS Y CONDICIONES DE USO DE VELIBRI</h1>
                <p className={styles.lastUpdated}>Última actualización: {lastUpdated}</p>

                <section className={styles.section}>
                    <h2>1. IDENTIFICACIÓN DEL PRESTADOR</h2>
                    <p>
                        Los presentes Términos y Condiciones de Uso, en adelante, los “Términos”, regulan el acceso, contratación y utilización de la plataforma de software como servicio denominada Velibri, en adelante, “Velibri”, la “Plataforma” o el “Servicio”.
                    </p>
                    <p>
                        Velibri es un producto operado y comercializado por:
                    </p>
                    <p style={{ paddingLeft: "1rem", borderLeft: "2px solid var(--accent-primary)" }}>
                        <strong>URBANINOVA S.L.</strong><br />
                        <strong>Nombre comercial:</strong> ECONOS<br />
                        <strong>CIF:</strong> B19736255<br />
                        <strong>Domicilio social:</strong> Urb. Puerto Caleta, núm. 114, 29751 Vélez-Málaga, Málaga, España<br />
                        <strong>Sitio web:</strong> <a href="https://www.econos.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>www.econos.io</a><br />
                        <strong>Correo electrónico:</strong> <a href="mailto:info@econos.io" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>info@econos.io</a>
                    </p>
                    <p>
                        En adelante, “ECONOS”, “URBANINOVA”, “nosotros” o el “Prestador”.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>2. OBJETO</h2>
                    <p>
                        Velibri es una plataforma SaaS destinada a facilitar y automatizar procesos relacionados con la creación, configuración, publicación, gestión, seguimiento y optimización de campañas y contenidos publicitarios digitales.
                    </p>
                    <p>
                        Velibri podrá permitir, entre otras funcionalidades:
                    </p>
                    <ul>
                        <li>conexión con plataformas publicitarias de terceros;</li>
                        <li>creación y gestión de campañas;</li>
                        <li>automatización de procesos publicitarios;</li>
                        <li>generación y adaptación de contenidos;</li>
                        <li>análisis de resultados;</li>
                        <li>utilización de tecnologías de inteligencia artificial;</li>
                        <li>recomendaciones y optimizaciones automatizadas.</li>
                    </ul>
                    <p>
                        La contratación de Velibri otorga al Cliente exclusivamente un derecho de acceso y uso de la Plataforma durante la vigencia de su suscripción y conforme al plan contratado.
                    </p>
                    <p>
                        La contratación no supone la adquisición, cesión o transmisión de ningún derecho de propiedad intelectual o industrial sobre Velibri.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>3. SERVICIO EXCLUSIVAMENTE B2B</h2>
                    <p>
                        Velibri está destinado exclusivamente a empresas, profesionales y trabajadores autónomos que contraten el Servicio en el marco de su actividad empresarial o profesional.
                    </p>
                    <p>
                        Velibri no está destinado a consumidores o usuarios que actúen con fines ajenos a una actividad comercial, empresarial, oficio o profesión.
                    </p>
                    <p>
                        La persona que contrate Velibri en representación de una empresa u organización declara disponer de las facultades y autorizaciones necesarias para vincular contractualmente a dicha entidad.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>4. ACEPTACIÓN DE LOS TÉRMINOS</h2>
                    <p>
                        La creación de una cuenta, contratación de una suscripción o utilización de Velibri requiere la aceptación previa de los presentes Términos y, cuando corresponda, de la Política de Privacidad y demás condiciones aplicables.
                    </p>
                    <p>
                        La aceptación se realizará mediante un mecanismo electrónico habilitado a tal efecto, incluyendo una casilla de aceptación que no estará premarcada.
                    </p>
                    <p>
                        ECONOS podrá conservar evidencia electrónica de la aceptación, incluyendo:
                    </p>
                    <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        <li style={{ marginBottom: "0.25rem" }}>identidad o cuenta del usuario que acepta;</li>
                        <li style={{ marginBottom: "0.25rem" }}>fecha y hora;</li>
                        <li style={{ marginBottom: "0.25rem" }}>versión de los Términos aceptada;</li>
                        <li style={{ marginBottom: "0.25rem" }}>versión de la Política de Privacidad aceptada;</li>
                        <li style={{ marginBottom: "0.25rem" }}>plan contratado;</li>
                        <li style={{ marginBottom: "0.25rem" }}>precio aceptado;</li>
                        <li style={{ marginBottom: "0.25rem" }}>periodo inicial contratado;</li>
                        <li style={{ marginBottom: "0.25rem" }}>duración de las renovaciones;</li>
                        <li style={{ marginBottom: "0.25rem" }}>condiciones de preaviso;</li>
                        <li style={{ marginBottom: "0.25rem" }}>registros técnicos razonablemente necesarios para acreditar la aceptación.</li>
                    </ol>
                    <p>
                        Las versiones anteriores de los Términos podrán conservarse con fines probatorios y de trazabilidad contractual.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>5. INFORMACIÓN DESTACADA ANTES DE LA CONTRATACIÓN</h2>
                    <p>
                        Antes de confirmar la contratación y realizar el pago, Velibri informará al Cliente de forma clara y accesible sobre las condiciones esenciales de su suscripción.
                    </p>
                    <p>
                        En particular, deberá informarse, cuando resulte aplicable, de:
                    </p>
                    <ul>
                        <li>plan contratado;</li>
                        <li>precio;</li>
                        <li>periodo contractual inicial;</li>
                        <li>forma de facturación;</li>
                        <li>duración de las renovaciones;</li>
                        <li>existencia de renovación automática;</li>
                        <li>plazo necesario para evitar la renovación;</li>
                        <li>funcionalidades principales incluidas.</li>
                    </ul>
                    <p>
                        Con carácter general, salvo condición particular distinta expresamente acordada:
                    </p>
                    <ul>
                        <li><strong>Periodo inicial mínimo:</strong> tres meses, facturados por adelantado.</li>
                        <li><strong>Renovación automática:</strong> periodos sucesivos de seis meses.</li>
                        <li><strong>Preaviso para evitar una renovación:</strong> al menos treinta días antes de la correspondiente fecha de renovación.</li>
                    </ul>
                    <p>
                        Estas condiciones esenciales no deberán quedar únicamente ocultas dentro del texto completo de los presentes Términos.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>6. CUENTA DE USUARIO</h2>
                    <p>
                        El Cliente deberá proporcionar información veraz, exacta y actualizada durante el registro y mantenerla actualizada durante la vigencia de la relación contractual.
                    </p>
                    <p>
                        Las credenciales de acceso son personales y deberán mantenerse bajo el control del Cliente.
                    </p>
                    <p>
                        El Cliente será responsable de las actividades realizadas desde sus cuentas y de proteger adecuadamente sus credenciales.
                    </p>
                    <p>
                        Queda prohibido compartir accesos con terceros no autorizados o permitir usos que excedan el número de usuarios, cuentas o permisos correspondientes al plan contratado.
                    </p>
                    <p>
                        El Cliente deberá informar a ECONOS sin demora indebida si detecta un acceso no autorizado, pérdida de credenciales o cualquier incidente de seguridad relacionado con su cuenta.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>7. PLANES Y MODALIDAD DE CONTRATACIÓN</h2>
                    <p>
                        Velibri se presta bajo un modelo de software como servicio o SaaS.
                    </p>
                    <p>
                        La contratación otorga al Cliente un derecho limitado de acceso y utilización de las funcionalidades correspondientes al plan contratado.
                    </p>
                    <p>
                        El precio podrá depender, entre otros factores, del número de cuentas gestionadas, funcionalidades habilitadas, usuarios, capacidades o servicios incluidos.
                    </p>
                    <p>
                        Los planes disponibles, características, límites y precios serán los publicados o comunicados por ECONOS en la oferta comercial vigente en el momento de la contratación.
                    </p>
                    <p>
                        ECONOS podrá modificar su catálogo de planes sin necesidad de modificar los presentes Términos, respetando las condiciones aplicables al periodo contractual vigente y las disposiciones sobre cambios de precio y renovación previstas en este documento.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>8. CRÉDITOS Y SISTEMAS DE USO RAZONABLE</h2>
                    <p>
                        ECONOS podrá incorporar en el futuro sistemas de créditos, límites de capacidad u otros mecanismos destinados a regular el uso razonable de recursos tecnológicos.
                    </p>
                    <p>
                        Salvo que se indique expresamente lo contrario, dichos créditos:
                    </p>
                    <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1rem" }} type="a">
                        <li style={{ marginBottom: "0.25rem" }}>no constituyen dinero;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no son moneda virtual;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no representan fondos propiedad del Cliente;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no son reembolsables ni canjeables por dinero;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no constituyen una penalización económica por el uso ordinario de Velibri.</li>
                    </ol>
                    <p>
                        Sus condiciones específicas serán comunicadas al Cliente cuando dicha funcionalidad sea implementada.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>9. ADD-ONS Y SERVICIOS ADICIONALES</h2>
                    <p>
                        ECONOS podrá ofrecer funcionalidades, productos o servicios adicionales denominados add-ons.
                    </p>
                    <p>
                        Estos podrán incluir, entre otros:
                    </p>
                    <ul>
                        <li>funcionalidades avanzadas de inteligencia artificial;</li>
                        <li>generación de determinados recursos publicitarios;</li>
                        <li>capacidades adicionales;</li>
                        <li>servicios complementarios.</li>
                    </ul>
                    <p>
                        La utilización de un add-on será opcional salvo que forme parte expresamente del plan contratado.
                    </p>
                    <p>
                        Los add-ons quedarán sujetos a estos Términos y, cuando corresponda, a condiciones específicas adicionales comunicadas antes de su contratación o activación.
                    </p>
                    <p>
                        Los servicios profesionales de consultoría, configuración especial, implantaciones, desarrollos personalizados u otros servicios no incluidos expresamente en la suscripción deberán contratarse separadamente.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>10. INVERSIÓN PUBLICITARIA</h2>
                    <p>
                        La suscripción a Velibri no incluye el presupuesto destinado por el Cliente a publicidad en Meta, Google, YouTube u otras plataformas.
                    </p>
                    <p>
                        Como modelo estándar, el Cliente contratará y pagará directamente su inversión publicitaria a las correspondientes plataformas mediante sus propias cuentas y métodos de pago.
                    </p>
                    <p>
                        ECONOS no actúa, bajo este modelo, como vendedor, revendedor o intermediario financiero de dicha inversión publicitaria.
                    </p>
                    <p>
                        Los costes por publicidad, impuestos, cargos, consumos, comisiones y demás importes facturados por las plataformas publicitarias externas serán responsabilidad del Cliente.
                    </p>
                    <p>
                        Cualquier modalidad distinta deberá acordarse expresamente y podrá quedar sujeta a condiciones adicionales.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>11. PLATAFORMAS Y SERVICIOS DE TERCEROS</h2>
                    <p>
                        Velibri podrá integrarse con servicios de terceros, incluyendo, entre otros:
                    </p>
                    <ul>
                        <li>Meta;</li>
                        <li>Facebook;</li>
                        <li>Instagram;</li>
                        <li>Google Ads;</li>
                        <li>YouTube;</li>
                        <li>otras plataformas publicitarias o tecnológicas.</li>
                    </ul>
                    <p>
                        ECONOS podrá incorporar, sustituir, modificar o retirar integraciones por razones técnicas, comerciales, legales, de seguridad o de disponibilidad de los servicios de terceros.
                    </p>
                    <p>
                        La incorporación de una integración no implica necesariamente que esté incluida en todos los planes.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>12. CUENTAS DEL CLIENTE EN PLATAFORMAS DE TERCEROS</h2>
                    <p>
                        El Cliente es responsable de disponer y mantener activas las cuentas necesarias en las plataformas externas que desee utilizar mediante Velibri.
                    </p>
                    <p>
                        Por ejemplo, para utilizar funcionalidades vinculadas con Google Ads, el Cliente deberá disponer de una cuenta compatible de Google Ads.
                    </p>
                    <p>
                        La creación, mantenimiento, verificación, configuración, administración y pago de estas cuentas externas corresponde al Cliente.
                    </p>
                    <p>
                        ECONOS no estará obligada a crear o mantener cuentas de terceros en nombre del Cliente salvo contratación expresa de un servicio adicional.
                    </p>
                    <p>
                        La imposibilidad de utilizar una funcionalidad de Velibri debido a que el Cliente:
                    </p>
                    <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1rem" }} type="a">
                        <li style={{ marginBottom: "0.25rem" }}>no disponga de la cuenta externa necesaria;</li>
                        <li style={{ marginBottom: "0.25rem" }}>haya perdido el acceso;</li>
                        <li style={{ marginBottom: "0.25rem" }}>tenga su cuenta suspendida o restringida;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no haya completado verificaciones exigidas;</li>
                        <li style={{ marginBottom: "0.25rem" }}>incumpla requisitos del proveedor externo;</li>
                    </ol>
                    <p>
                        no constituirá, por sí misma, un incumplimiento de ECONOS ni dará derecho a reducción, compensación o reembolso de la suscripción.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>13. AUTORIZACIÓN PARA OPERAR CUENTAS PUBLICITARIAS</h2>
                    <p>
                        Al conectar una cuenta publicitaria externa con Velibri, el Cliente declara disponer de autorización suficiente para hacerlo.
                    </p>
                    <p>
                        El Cliente autoriza a Velibri a interactuar con dichas cuentas dentro de:
                    </p>
                    <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1rem" }} type="a">
                        <li style={{ marginBottom: "0.25rem" }}>los permisos concedidos;</li>
                        <li style={{ marginBottom: "0.25rem" }}>las funcionalidades disponibles;</li>
                        <li style={{ marginBottom: "0.25rem" }}>las instrucciones y configuraciones establecidas por el Cliente;</li>
                        <li style={{ marginBottom: "0.25rem" }}>las capacidades permitidas por las APIs correspondientes;</li>
                        <li style={{ marginBottom: "0.25rem" }}>las políticas aplicables de cada proveedor externo.</li>
                    </ol>
                    <p>
                        Las autorizaciones concedidas mediante la configuración, activación o aprobación de funcionalidades dentro de Velibri podrán considerarse instrucciones válidas del Cliente para ejecutar las operaciones correspondientes.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>14. AUTOMATIZACIÓN DE CAMPAÑAS</h2>
                    <p>
                        Velibri podrá permitir al Cliente autorizar la creación, publicación, modificación, gestión y optimización automatizada de campañas publicitarias.
                    </p>
                    <p>
                        Cuando una funcionalidad de automatización haya sido activada por el Cliente, Velibri podrá realizar acciones dentro de los parámetros, límites, objetivos y configuraciones autorizados.
                    </p>
                    <p>
                        Estas acciones podrán incluir:
                    </p>
                    <ul>
                        <li>creación de campañas;</li>
                        <li>publicación;</li>
                        <li>modificación;</li>
                        <li>optimización;</li>
                        <li>ajustes de determinados parámetros;</li>
                        <li>recomendaciones;</li>
                        <li>automatizaciones de presupuesto;</li>
                        <li>pujas;</li>
                        <li>audiencias;</li>
                        <li>segmentación;</li>
                        <li>distribución;</li>
                        <li>otras acciones técnicamente habilitadas.</li>
                    </ul>
                    <p>
                        La disponibilidad de cada función dependerá de Velibri, del plan contratado y de las capacidades y políticas de los proveedores externos.
                    </p>
                    <p>
                        ECONOS no garantiza que todas las funcionalidades automatizadas estén disponibles para todos los canales, cuentas o tipos de campaña.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>15. INTELIGENCIA ARTIFICIAL</h2>
                    <p>
                        Velibri podrá utilizar sistemas de inteligencia artificial y automatización.
                    </p>
                    <p>
                        Estas funcionalidades podrán incluir:
                    </p>
                    <ul>
                        <li>generación de textos;</li>
                        <li>creación o adaptación de contenidos;</li>
                        <li>generación o adaptación de imágenes;</li>
                        <li>recomendaciones publicitarias;</li>
                        <li>análisis de campañas;</li>
                        <li>propuestas de segmentación;</li>
                        <li>recomendaciones de presupuesto;</li>
                        <li>optimización;</li>
                        <li>generación de variantes;</li>
                        <li>automatización de determinadas decisiones previamente autorizadas.</li>
                    </ul>
                    <p>
                        Los sistemas de inteligencia artificial pueden producir resultados incorrectos, incompletos, inexactos, no exclusivos o inadecuados para determinadas circunstancias.
                    </p>
                    <p>
                        El Cliente deberá verificar, cuando corresponda, la información esencial relacionada con sus campañas, incluyendo precios, características de productos o inmuebles, promociones, condiciones comerciales y cualquier información cuya exactitud resulte relevante.
                    </p>
                    <p>
                        ECONOS no garantiza que un contenido generado mediante inteligencia artificial sea totalmente preciso, único o exclusivo.
                    </p>
                    <p>
                        El uso de inteligencia artificial no implica la transferencia al Cliente de derechos sobre los modelos, tecnología, sistemas, algoritmos, prompts internos o procesos utilizados por Velibri.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>16. RESPONSABILIDAD DEL CLIENTE SOBRE LOS CONTENIDOS</h2>
                    <p>
                        El Cliente es responsable de los contenidos, materiales, información y datos que introduzca, conecte, cargue, genere, configure o publique utilizando Velibri.
                    </p>
                    <p>
                        El Cliente garantiza disponer de los derechos, licencias, permisos y autorizaciones necesarios.
                    </p>
                    <p>
                        Esto incluye:
                    </p>
                    <ul>
                        <li>fotografías;</li>
                        <li>vídeos;</li>
                        <li>marcas;</li>
                        <li>logotipos;</li>
                        <li>textos;</li>
                        <li>información de inmuebles;</li>
                        <li>precios;</li>
                        <li>promociones;</li>
                        <li>bases de datos;</li>
                        <li>datos de terceros;</li>
                        <li>contenidos publicitarios.</li>
                    </ul>
                    <p>
                        El Cliente será responsable de garantizar la exactitud de la información comercial esencial incluida en sus campañas.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>17. POLÍTICAS PUBLICITARIAS DE TERCEROS</h2>
                    <p>
                        El Cliente será responsable de que sus campañas y contenidos cumplan las condiciones y políticas aplicables de Meta, Google y cualquier otra plataforma utilizada.
                    </p>
                    <p>
                        ECONOS no será responsable de contenidos creados, proporcionados, configurados o publicados por el Cliente que incumplan dichas políticas.
                    </p>
                    <p>
                        ECONOS tampoco será responsable, en la medida permitida por la legislación aplicable, de consecuencias derivadas de esos incumplimientos, incluyendo:
                    </p>
                    <ul>
                        <li>rechazo de anuncios;</li>
                        <li>limitación de campañas;</li>
                        <li>suspensión de cuentas;</li>
                        <li>pérdida de permisos;</li>
                        <li>bloqueos;</li>
                        <li>restricciones publicitarias;</li>
                        <li>otras medidas adoptadas por terceros.</li>
                    </ul>
                    <p>
                        Las políticas de terceros pueden modificarse y corresponde al Cliente mantener sus campañas y contenidos conforme a las reglas aplicables en cada momento.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>18. SERVICIOS Y DECISIONES DE TERCEROS</h2>
                    <p>
                        ECONOS no controla las plataformas publicitarias externas.
                    </p>
                    <p>
                        Por tanto, no será responsable, salvo cuando legalmente proceda, de:
                    </p>
                    <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1rem" }} type="a">
                        <li style={{ marginBottom: "0.25rem" }}>rechazo de anuncios;</li>
                        <li style={{ marginBottom: "0.25rem" }}>suspensión o restricción de cuentas publicitarias;</li>
                        <li style={{ marginBottom: "0.25rem" }}>retirada de permisos;</li>
                        <li style={{ marginBottom: "0.25rem" }}>cambios en APIs;</li>
                        <li style={{ marginBottom: "0.25rem" }}>modificaciones de algoritmos;</li>
                        <li style={{ marginBottom: "0.25rem" }}>cambios de políticas;</li>
                        <li style={{ marginBottom: "0.25rem" }}>interrupciones de servicios externos;</li>
                        <li style={{ marginBottom: "0.25rem" }}>limitaciones de funcionalidades;</li>
                        <li style={{ marginBottom: "0.25rem" }}>cambios en sistemas de subasta o distribución publicitaria;</li>
                        <li style={{ marginBottom: "0.25rem" }}>eliminación de integraciones;</li>
                        <li style={{ marginBottom: "0.25rem" }}>decisiones adoptadas unilateralmente por proveedores externos.</li>
                    </ol>
                    <p>
                        ECONOS realizará esfuerzos comercialmente razonables para adaptar o restablecer integraciones cuando resulte técnicamente posible.
                    </p>
                    <p>
                        Lo anterior no excluye la responsabilidad que pudiera corresponder a ECONOS cuando una incidencia resulte directamente imputable a un funcionamiento incorrecto de Velibri atribuible a URBANINOVA S.L., conforme al régimen general de responsabilidad previsto en estos Términos.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>19. AUSENCIA DE GARANTÍA DE RESULTADOS PUBLICITARIOS</h2>
                    <p>
                        Velibri es una herramienta tecnológica de automatización y gestión publicitaria.
                    </p>
                    <p>
                        ECONOS no garantiza resultados económicos, comerciales o publicitarios determinados.
                    </p>
                    <p>
                        En particular, no se garantiza:
                    </p>
                    <table style={{ width: "100%", color: "var(--text-secondary)", marginBottom: "1rem", borderCollapse: "collapse" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• número de leads</td>
                                <td style={{ padding: "0.25rem 0" }}>• contactos</td>
                                <td style={{ padding: "0.25rem 0" }}>• alcance</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• impresiones</td>
                                <td style={{ padding: "0.25rem 0" }}>• clics</td>
                                <td style={{ padding: "0.25rem 0" }}>• conversiones</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• ventas</td>
                                <td style={{ padding: "0.25rem 0" }}>• reservas</td>
                                <td style={{ padding: "0.25rem 0" }}>• coste por lead</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• CPA</td>
                                <td style={{ padding: "0.25rem 0" }}>• ROI</td>
                                <td style={{ padding: "0.25rem 0" }}>• ROAS</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• posicionamiento</td>
                                <td style={{ padding: "0.25rem 0" }}>• aprobación de anuncios</td>
                                <td style={{ padding: "0.25rem 0" }}>• disponibilidad de inventario publicitario</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }} colSpan={3}>• resultados derivados de algoritmos o subastas externas</td>
                            </tr>
                        </tbody>
                    </table>
                    <p>
                        La obligación de ECONOS consiste en prestar el Servicio contratado conforme a estos Términos, pero no constituye una obligación de obtener un resultado económico o comercial específico.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>20. PROPIEDAD DEL CLIENTE</h2>
                    <p>
                        El Cliente conserva los derechos que legítimamente le correspondan sobre los contenidos que aporte a Velibri.
                    </p>
                    <p>
                        Esto podrá incluir:
                    </p>
                    <ul>
                        <li>marcas;</li>
                        <li>logotipos;</li>
                        <li>fotografías;</li>
                        <li>vídeos;</li>
                        <li>textos;</li>
                        <li>información de inmuebles;</li>
                        <li>bases de datos propias;</li>
                        <li>otros contenidos originales.</li>
                    </ul>
                    <p>
                        El Cliente concede a URBANINOVA S.L., durante el tiempo necesario, una licencia limitada, no exclusiva y suficiente para alojar, procesar, transformar técnicamente, reproducir o utilizar dichos contenidos exclusivamente en la medida necesaria para prestar Velibri y ejecutar las instrucciones del Cliente.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>21. PROPIEDAD INTELECTUAL E INDUSTRIAL DE VELIBRI</h2>
                    <p>
                        Todos los derechos de propiedad intelectual e industrial relacionados con Velibri corresponden a URBANINOVA S.L. o a sus legítimos licenciantes.
                    </p>
                    <p>
                        Esto incluye, sin carácter limitativo:
                    </p>
                    <table style={{ width: "100%", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• software</td>
                                <td style={{ padding: "0.25rem 0" }}>• código fuente</td>
                                <td style={{ padding: "0.25rem 0" }}>• código objeto</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• arquitectura</td>
                                <td style={{ padding: "0.25rem 0" }}>• diseño</td>
                                <td style={{ padding: "0.25rem 0" }}>• interfaces</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• algoritmos</td>
                                <td style={{ padding: "0.25rem 0" }}>• flujos</td>
                                <td style={{ padding: "0.25rem 0" }}>• automatizaciones</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• metodologías</td>
                                <td style={{ padding: "0.25rem 0" }}>• prompts internos</td>
                                <td style={{ padding: "0.25rem 0" }}>• modelos propios</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• sistemas</td>
                                <td style={{ padding: "0.25rem 0" }}>• documentación</td>
                                <td style={{ padding: "0.25rem 0" }}>• procesos</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }}>• know-how</td>
                                <td style={{ padding: "0.25rem 0" }}>• bases de datos propias</td>
                                <td style={{ padding: "0.25rem 0" }}>• elementos gráficos</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "0.25rem 0" }} colSpan={3}>• mejoras, desarrollos y funcionalidades</td>
                            </tr>
                        </tbody>
                    </table>
                    <p>
                        La suscripción no supone una venta de Velibri.
                    </p>
                    <p>
                        El Cliente adquiere exclusivamente un derecho limitado, no exclusivo y no transferible para acceder y utilizar Velibri durante la vigencia de su contrato y sujeto al cumplimiento de estos Términos.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>22. CONTENIDOS GENERADOS MEDIANTE VELIBRI</h2>
                    <p>
                        El Cliente podrá utilizar comercialmente los contenidos finales generados específicamente para sus campañas mediante Velibri, dentro de los límites establecidos por la legislación aplicable y los derechos de terceros.
                    </p>
                    <p>
                        Este derecho no supone la transmisión de derechos sobre:
                    </p>
                    <ul>
                        <li>plantillas internas;</li>
                        <li>tecnología;</li>
                        <li>prompts;</li>
                        <li>modelos;</li>
                        <li>sistemas de generación;</li>
                        <li>algoritmos;</li>
                        <li>componentes reutilizables;</li>
                        <li>metodologías;</li>
                        <li>procesos internos.</li>
                    </ul>
                    <p>
                        Cuando intervengan sistemas de inteligencia artificial, ECONOS no garantiza la exclusividad absoluta del resultado ni que contenidos similares no puedan ser generados para otros usuarios.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>23. USOS PROHIBIDOS</h2>
                    <p>
                        El Cliente no podrá:
                    </p>
                    <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1rem" }} type="a">
                        <li style={{ marginBottom: "0.25rem" }}>copiar, reproducir o explotar Velibri fuera de los usos autorizados;</li>
                        <li style={{ marginBottom: "0.25rem" }}>descompilar o realizar ingeniería inversa salvo en los supuestos permitidos por normas imperativas;</li>
                        <li style={{ marginBottom: "0.25rem" }}>intentar obtener el código fuente o lógica interna;</li>
                        <li style={{ marginBottom: "0.25rem" }}>compartir credenciales con terceros no autorizados;</li>
                        <li style={{ marginBottom: "0.25rem" }}>revender o sublicenciar Velibri sin autorización escrita;</li>
                        <li style={{ marginBottom: "0.25rem" }}>utilizar bots, scrapers o automatizaciones externas no autorizadas;</li>
                        <li style={{ marginBottom: "0.25rem" }}>realizar extracciones masivas no autorizadas de datos;</li>
                        <li style={{ marginBottom: "0.25rem" }}>vulnerar o intentar vulnerar la seguridad de Velibri;</li>
                        <li style={{ marginBottom: "0.25rem" }}>interferir con la disponibilidad o funcionamiento de la Plataforma;</li>
                        <li style={{ marginBottom: "0.25rem" }}>utilizar el Servicio para actividades ilegales, fraudulentas o engañosas;</li>
                        <li style={{ marginBottom: "0.25rem" }}>infringir derechos de propiedad intelectual o derechos de terceros;</li>
                        <li style={{ marginBottom: "0.25rem" }}>utilizar Velibri incumpliendo las políticas de plataformas integradas;</li>
                        <li style={{ marginBottom: "0.25rem" }}>utilizar la Plataforma para desarrollar un producto competidor mediante copia sustancial de funcionalidades, diseño, flujos, tecnología o elementos protegidos.</li>
                    </ol>
                </section>

                <section className={styles.section}>
                    <h2>24. SUSPENSIÓN DEL SERVICIO</h2>
                    <p>
                        ECONOS podrá suspender temporalmente o limitar el acceso del Cliente cuando exista una causa justificada.
                    </p>
                    <p>
                        Entre otras:
                    </p>
                    <ul>
                        <li>incumplimiento de estos Términos;</li>
                        <li>impago;</li>
                        <li>uso ilícito;</li>
                        <li>fraude;</li>
                        <li>riesgo de seguridad;</li>
                        <li>vulneración de derechos de terceros;</li>
                        <li>uso abusivo;</li>
                        <li>riesgo para la infraestructura;</li>
                        <li>incumplimiento grave de políticas de plataformas integradas.</li>
                    </ul>
                    <p>
                        Como regla general, ECONOS comunicará previamente al Cliente la situación y, cuando resulte razonablemente posible, concederá un plazo adecuado para subsanar un posible incumplimiento.
                    </p>
                    <p>
                        ECONOS podrá suspender inmediatamente el acceso cuando exista:
                    </p>
                    <ul>
                        <li>riesgo de seguridad;</li>
                        <li>fraude;</li>
                        <li>actividad presuntamente ilegal;</li>
                        <li>riesgo grave para Velibri;</li>
                        <li>riesgo para otros usuarios o terceros;</li>
                        <li>requerimiento de autoridad competente;</li>
                        <li>obligación legal de actuación inmediata.</li>
                    </ul>
                    <p>
                        La suspensión no implicará automáticamente la cancelación del contrato.
                    </p>
                    <p>
                        Una vez desaparecida la causa que motivó la suspensión y subsanado el incumplimiento, ECONOS podrá restablecer el acceso al Servicio, salvo que el contrato haya sido válidamente resuelto o exista otra causa legítima que impida la reactivación.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>25. PRECIO Y FACTURACIÓN</h2>
                    <p>
                        El Cliente abonará el precio correspondiente al plan y servicios contratados conforme a las condiciones comerciales aceptadas.
                    </p>
                    <p>
                        Salvo acuerdo distinto, el periodo inicial tendrá una duración mínima de tres meses, facturados por adelantado.
                    </p>
                    <p>
                        Los impuestos legalmente aplicables se añadirán cuando corresponda.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>26. DURACIÓN Y RENOVACIÓN</h2>
                    <p>
                        La contratación inicial tendrá una duración mínima de tres meses.
                    </p>
                    <p>
                        Finalizado el periodo inicial, la suscripción se renovará automáticamente por periodos sucesivos de seis meses, salvo que el Cliente solicite la no renovación conforme a estos Términos.
                    </p>
                    <p>
                        Para evitar una renovación, el Cliente deberá comunicar su voluntad de cancelar con un mínimo de treinta días de antelación a la fecha de inicio del siguiente periodo de renovación.
                    </p>
                    <p>
                        La solicitud deberá enviarse por correo electrónico a: <a href="mailto:info@econos.io" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>info@econos.io</a>
                    </p>
                    <p>
                        La cancelación comunicada fuera de dicho plazo surtirá efecto para el siguiente periodo susceptible de cancelación conforme a estas condiciones.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>27. AUSENCIA DE REEMBOLSOS Y FALTA DE USO</h2>
                    <p>
                        No procederán reembolsos, totales o parciales, por:
                    </p>
                    <ul>
                        <li>falta de uso del Servicio;</li>
                        <li>utilización parcial de Velibri;</li>
                        <li>cancelación voluntaria durante un periodo contractual ya iniciado;</li>
                        <li>causas imputables al Cliente.</li>
                    </ul>
                    <p>
                        La falta de publicación de campañas, la decisión del Cliente de no utilizar determinadas funcionalidades o la falta de conexión de las cuentas externas necesarias no dará derecho a reducción, devolución o compensación de las cantidades correspondientes al periodo contratado.
                    </p>
                    <p>
                        La decisión del Cliente de no utilizar total o parcialmente la Plataforma no suspende el contrato, no reduce las cuotas, no genera derecho a descuentos, no genera derecho a compensaciones ni genera derecho a reembolsos.
                    </p>
                    <p>
                        Lo anterior se entiende sin perjuicio de los derechos que legalmente correspondan al Cliente cuando exista un incumplimiento contractual grave directamente imputable a URBANINOVA S.L. o cuando una devolución resulte obligatoria conforme a una norma imperativa aplicable.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>28. IMPAGO</h2>
                    <p>
                        En caso de impago, ECONOS podrá realizar hasta tres intentos de cobro.
                    </p>
                    <p>
                        Si la deuda continúa pendiente, podrá remitirse una comunicación al Cliente solicitando su regularización.
                    </p>
                    <p>
                        Si transcurren diez días hábiles desde dicha comunicación sin que la deuda haya sido regularizada, ECONOS podrá suspender el acceso a Velibri.
                    </p>
                    <p>
                        La suspensión por impago:
                    </p>
                    <ol style={{ paddingLeft: "1.5rem", color: "var(--text-secondary)", marginBottom: "1rem" }} type="a">
                        <li style={{ marginBottom: "0.25rem" }}>no cancela automáticamente el contrato;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no extingue las cantidades pendientes;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no elimina las obligaciones económicas asumidas;</li>
                        <li style={{ marginBottom: "0.25rem" }}>no exime al Cliente del pago correspondiente al periodo contractual comprometido.</li>
                    </ol>
                    <p>
                        El Cliente continuará obligado al pago de las cantidades correspondientes al periodo contratado, incluso si el acceso ha sido suspendido por un incumplimiento imputable al propio Cliente.
                    </p>
                    <p>
                        En caso de persistencia del impago después de la suspensión, URBANINOVA S.L. podrá resolver definitivamente el contrato, previa comunicación al Cliente, sin perjuicio de su derecho a reclamar las cantidades vencidas y aquellas que resulten contractualmente exigibles conforme al periodo comprometido.
                    </p>
                    <p>
                        La resolución del contrato por impago no extinguirá las obligaciones de pago ya devengadas o exigibles.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>29. DISPONIBILIDAD DEL SERVICIO</h2>
                    <p>
                        Los planes estándar de Velibri no incluyen un acuerdo de nivel de servicio o SLA garantizado.
                    </p>
                    <p>
                        ECONOS realizará esfuerzos comercialmente razonables para mantener Velibri disponible y operativo.
                    </p>
                    <p>
                        Podrán producirse interrupciones de disponibilidad derivadas de:
                    </p>
                    <ul>
                        <li>mantenimiento, actualizaciones o mejoras;</li>
                        <li>incidencias técnicas o medidas de seguridad;</li>
                        <li>servicios de terceros o proveedores de infraestructura;</li>
                        <li>telecomunicaciones o APIs externas;</li>
                        <li>fuerza mayor o circunstancias fuera del control razonable de ECONOS.</li>
                    </ul>
                    <p>
                        Los clientes Enterprise u otros clientes podrán acordar condiciones de disponibilidad específicas mediante contrato separado.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>30. MODIFICACIONES DE VELIBRI</h2>
                    <p>
                        ECONOS podrá desarrollar, evolucionar, añadir, modificar, sustituir o retirar funcionalidades de Velibri por razones técnicas, comerciales, legales, regulatorias, de seguridad, de cumplimiento o relacionadas con proveedores externos.
                    </p>
                    <p>
                        Durante un periodo contractual ya iniciado, URBANINOVA S.L. procurará no realizar reducciones sustanciales e injustificadas de las funcionalidades esenciales incluidas en el plan contratado.
                    </p>
                    <p>
                        Cuando una modificación relevante resulte necesaria por razones legales, regulatorias, de seguridad, técnicas o por cambios impuestos por proveedores externos, podrá aplicarse durante el periodo vigente, informando al Cliente cuando resulte razonablemente posible.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>31. CAMBIOS DE PRECIO</h2>
                    <p>
                        ECONOS podrá modificar los precios de sus planes.
                    </p>
                    <p>
                        Salvo causa distinta debidamente comunicada u obligación legal, los nuevos precios serán aplicables al siguiente periodo de renovación y serán comunicados previamente al Cliente.
                    </p>
                    <p>
                        El precio aplicable durante un periodo contractual ya iniciado no será modificado retroactivamente.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>32. MODIFICACIÓN DE LOS TÉRMINOS</h2>
                    <p>
                        ECONOS podrá actualizar estos Términos para adaptarlos a cambios legislativos, modificaciones del Servicio, nuevas funcionalidades, requisitos de seguridad, cambios regulatorios, cambios de terceros o necesidades operativas razonables.
                    </p>
                    <p>
                        Las modificaciones sustanciales serán comunicadas al Cliente por medios razonables.
                    </p>
                    <p>
                        Los cambios ordinarios que afecten materialmente a la relación con el cliente se comunicarán antes de su entrada en vigor.
                    </p>
                    <p>
                        Los cambios sustanciales que resulten perjudiciales para el Cliente no se aplicarán retroactivamente a un periodo contractual ya iniciado, salvo cuando resulten necesarios por obligación legal, regulatoria, de seguridad o por otra causa imperativa.
                    </p>
                    <p>
                        Cuando un cambio deba aplicarse inmediatamente por exigencia legal, seguridad, fraude o requisitos regulatorios o técnicos inevitables, ECONOS podrá aplicarlo sin esperar al siguiente periodo de renovación.
                    </p>
                    <p>
                        Cuando la naturaleza de la modificación requiera una nueva aceptación expresa, Velibri podrá solicitarla mediante el correspondiente mecanismo electrónico.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>33. PROTECCIÓN DE DATOS PERSONALES</h2>
                    <p>
                        El tratamiento de datos personales realizado por ECONOS se regirá por la Política de Privacidad de Velibri y por la normativa aplicable.
                    </p>
                    <p>
                        Cuando ECONOS trate datos personales por cuenta del Cliente en calidad de encargado del tratamiento, dicha relación quedará sujeta al correspondiente Acuerdo de Encargo del Tratamiento o DPA, cuando resulte aplicable.
                    </p>
                    <p>
                        El Cliente será responsable de determinar la legitimidad del tratamiento de los datos personales que incorpore o conecte con Velibri cuando actúe como responsable del tratamiento.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>34. TERMINACIÓN Y CONSERVACIÓN DE DATOS</h2>
                    <p>
                        Cuando finalice definitivamente la relación contractual, el acceso del Cliente podrá ser desactivado.
                    </p>
                    <p>
                        Una cuenta cancelada no tendrá que ser conservada como cuenta activa recuperable.
                    </p>
                    <p>
                        Si el Cliente desea volver a utilizar Velibri posteriormente, podrá ser necesario realizar una nueva contratación y crear una nueva cuenta.
                    </p>
                    <p>
                        Los datos operativos asociados al funcionamiento ordinario de la cuenta podrán conservarse durante un plazo técnico máximo de treinta días después de la terminación, con el objeto de completar procesos técnicos, administrativos o de cierre. Posteriormente serán eliminados o anonimizados cuando corresponda.
                    </p>
                    <p>
                        No obstante, URBANINOVA S.L. podrá conservar, debidamente bloqueados o con acceso restringido, aquellos datos o documentos cuya conservación resulte necesaria para cumplir obligaciones legales, fiscales, contables, mercantiles o para la formulación, ejercicio o defensa frente a reclamaciones, durante los plazos legalmente aplicables.
                    </p>
                    <p>
                        Todo lo anterior se entiende sin perjuicio de las disposiciones específicas contenidas en el Acuerdo de Encargo del Tratamiento o DPA que resulte aplicable.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>35. EXPORTACIÓN DE DATOS Y SALIDA DEL SERVICIO</h2>
                    <p>
                        Antes del cierre definitivo de la cuenta, el Cliente podrá solicitar u obtener, cuando técnicamente proceda y conforme a las funcionalidades disponibles, una copia o exportación de sus propios datos relevantes.
                    </p>
                    <p>
                        La exportación podrá incluir, según proceda:
                    </p>
                    <ul>
                        <li>datos de cuenta;</li>
                        <li>configuraciones propias;</li>
                        <li>campañas;</li>
                        <li>contenidos aportados por el Cliente;</li>
                        <li>determinados históricos;</li>
                        <li>informes;</li>
                        <li>otros datos exportables generados durante el uso ordinario del Servicio.</li>
                    </ul>
                    <p>
                        Quedarán excluidos de cualquier obligación de exportación el código fuente, algoritmos, prompts internos, modelos, lógica propietaria, secretos empresariales, componentes de software internos de Velibri y datos de terceros respecto de los cuales el Cliente no tenga derecho de acceso.
                    </p>
                    <p>
                        El Cliente deberá realizar la exportación antes de la terminación del Servicio. Transcurrido el plazo de conservación aplicable, ECONOS podrá eliminar o anonimizar los datos conforme a estos Términos y a la normativa vigente.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>36. LIMITACIÓN DE RESPONSABILIDAD</h2>
                    <p>
                        En la máxima medida permitida por la legislación aplicable, la responsabilidad total acumulada de URBANINOVA S.L. frente al Cliente derivada del contrato o relacionada con Velibri quedará limitada al importe efectivamente pagado por el Cliente a ECONOS por Velibri durante los seis meses inmediatamente anteriores al hecho que origine la reclamación.
                    </p>
                    <p>
                        En la medida permitida por la ley, ECONOS no responderá de daños indirectos o consecuenciales, incluyendo lucro cesante, pérdida de oportunidades, pérdida de negocio, pérdida de reputación, decisiones comerciales del Cliente, pérdida de datos imputable a terceros o resultados económicos no obtenidos.
                    </p>
                    <p>
                        Las limitaciones anteriores no serán aplicables en caso de dolo ni en aquellos supuestos en los que una norma imperativa impida excluir o limitar la responsabilidad.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>37. FUERZA MAYOR Y CIRCUNSTANCIAS FUERA DEL CONTROL RAZONABLE</h2>
                    <p>
                        Ninguna parte será responsable por incumplimientos directamente causados por acontecimientos fuera de su control razonable, durante el tiempo y en la medida en que dichos acontecimientos impidan el cumplimiento.
                    </p>
                    <p>
                        Esto podrá incluir: desastres naturales, conflictos, interrupciones generalizadas de telecomunicaciones, fallos graves de infraestructura externa, ciberataques generalizados no imputables a una falta de diligencia, actos de autoridades, restricciones legales sobrevenidas o interrupciones extraordinarias de proveedores esenciales.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>38. INDEPENDENCIA DE LAS CLÁUSULAS</h2>
                    <p>
                        Si alguna disposición de estos Términos fuera declarada total o parcialmente inválida, ilegal o inaplicable, ello no afectará a la validez de las restantes disposiciones. La disposición afectada será interpretada o sustituida, cuando resulte posible, de forma que se aproxime a su finalidad original respetando la legislación aplicable.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>39. NO RENUNCIA</h2>
                    <p>
                        La falta de ejercicio o retraso en el ejercicio de un derecho reconocido en estos Términos no supondrá una renuncia permanente a dicho derecho.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>40. CESIÓN</h2>
                    <p>
                        El Cliente no podrá ceder su contrato, cuenta o derechos derivados de Velibri a un tercero sin autorización previa y escrita de ECONOS.
                    </p>
                    <p>
                        URBANINOVA S.L. podrá realizar operaciones de reorganización empresarial, sucesión, fusión, adquisición o transmisión de la actividad relacionada con Velibri conforme a la legislación aplicable, garantizando la continuidad de las obligaciones contractuales que correspondan.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>41. COMUNICACIONES</h2>
                    <p>
                        Las comunicaciones contractuales podrán realizarse mediante correo electrónico asociado a la cuenta, avisos dentro de Velibri u otros canales electrónicos adecuados.
                    </p>
                    <p>
                        El Cliente será responsable de mantener actualizada su información de contacto. Las solicitudes de cancelación deberán realizarse enviando un correo a: <a href="mailto:info@econos.io" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>info@econos.io</a>
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>42. LEY APLICABLE Y JURISDICCIÓN</h2>
                    <p>
                        Los presentes Términos se regirán e interpretarán conforme a la legislación española.
                    </p>
                    <p>
                        Para cualquier controversia relacionada con la interpretación, ejecución o cumplimiento de estos Términos, las partes se someten, en la medida legalmente permitida, a los Juzgados y Tribunales de Málaga, España, con renuncia a cualquier otro fuero que pudiera corresponderles cuando dicha renuncia sea legalmente válida.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>43. ACUERDO CONTRACTUAL</h2>
                    <p>
                        Los presentes Términos, junto con la Política de Privacidad, el plan contratado, las condiciones comerciales aceptadas, las condiciones específicas de add-ons, el Acuerdo de Encargo del Tratamiento (DPA), cuando corresponda, posibles SLA, contratos Enterprise u otros acuerdos específicos expresamente aceptados, conformarán el marco contractual aplicable al uso de Velibri.
                    </p>
                    <p>
                        En caso de existir un contrato individual negociado y firmado entre URBANINOVA S.L. y un Cliente, sus condiciones particulares prevalecerán exclusivamente respecto de aquellas materias en las que exista una contradicción expresa.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>44. CONTACTO</h2>
                    <p style={{ paddingLeft: "1rem", borderLeft: "2px solid var(--accent-primary)" }}>
                        <strong>URBANINOVA S.L.</strong><br />
                        <strong>Nombre comercial:</strong> ECONOS<br />
                        <strong>CIF:</strong> B19736255<br />
                        <strong>Domicilio social:</strong> Urb. Puerto Caleta, núm. 114, 29751 Vélez-Málaga, Málaga, España<br />
                        <strong>Sitio web:</strong> <a href="https://www.econos.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>www.econos.io</a><br />
                        <strong>Correo electrónico:</strong> <a href="mailto:info@econos.io" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>info@econos.io</a>
                    </p>
                </section>

                <div className={styles.footer}>
                    &copy; {new Date().getFullYear()} Econos. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
}
