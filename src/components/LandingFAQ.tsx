import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";
export default function LandingFAQ() {
    return (<>
        {/* FAQ Section */}
        <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 bg-background">
          <div className="container mx-auto max-w-4xl">
            <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
              <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground"/>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 md:mb-12 text-center px-2">Frequently Asked Questions (FAQs)</h3>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="certification">Certification</TabsTrigger>
                <TabsTrigger value="career">Career</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>What is Kairos Security Academy?</AccordionTrigger>
                    <AccordionContent>
                      Kairos Security Academy is a premier training institution dedicated to preparing security officers for excellence in their field. We combine expertise, innovation, and a passion for excellence to provide security training that not only protects but also empowers.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>How long does the training take?</AccordionTrigger>
                    <AccordionContent>
                      The Level 2 course typically takes several weeks to complete, depending on your schedule and pace. We offer flexible learning options to accommodate working professionals. Level 3 and Level 4 are two-part courses: Part 1 is completed online, and Part 2 requires in-person training in the Houston area with Kairos Security.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>What are the prerequisites for enrollment?</AccordionTrigger>
                    <AccordionContent>
                      For our Level 2 course, you must be at least 18 years old and have a clean background check. Additional requirements may apply for Level 3 certification. We'll guide you through all necessary steps during the enrollment process.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="certification">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="cert-1">
                    <AccordionTrigger>Does the online Level 3 course by itself make me certified?</AccordionTrigger>
                    <AccordionContent>
                      <strong>No.</strong> The online course is theory only. It helps you learn the classroom portion, but it does not give you a Texas Level 3 certificate and does not qualify you for a commissioned officer license by itself.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-2">
                    <AccordionTrigger>Can I use the online course alone to apply with DPS/TOPS?</AccordionTrigger>
                    <AccordionContent>
                      <strong>No.</strong> To apply for your license, DPS/TOPS requires a completed Level 3 certificate from a DPS-approved training school. Kairos only issues that certificate after you complete both the online theory and the in-person firearms/practical training with us.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-3">
                    <AccordionTrigger>What do I get if I only finish the online theory?</AccordionTrigger>
                    <AccordionContent>
                      You'll receive an <strong>Online Theory Completion Report</strong> from Kairos Security Academy for your own records. This is <strong>not a DPS Level 3 certificate</strong> and cannot be submitted to DPS/TOPS for licensing.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-4">
                    <AccordionTrigger>I took an online Level 3 course somewhere else. Can I just do the in-person part with Kairos?</AccordionTrigger>
                    <AccordionContent>
                      <strong>No.</strong> For us to issue a Level 3 certificate in our name, we must provide and verify all required parts of the training. That means your online theory and in-person practical work must both be completed through Kairos Security Academy. We do not issue Level 3 or Level 4 certificates based solely on online training completed with another provider. If you started your training elsewhere, you can either finish with that provider or enroll in the full Kairos Certification Path.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-5">
                    <AccordionTrigger>Can I still benefit from the online-only course if I live far away?</AccordionTrigger>
                    <AccordionContent>
                      Yes. The online theory course is great if you want to learn the material, prepare ahead of time, or decide if a career in security is right for you. But remember, you'll still need to complete in-person training with a DPS-approved school to become fully certified.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-6">
                    <AccordionTrigger>What is included in the Level 3 and Level 4 online course price?</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">The online price for Level 3 and Level 4 courses covers <strong>Part 1 (Online Training) only</strong>. This includes all video lessons and the online exam.</p>
                      <p className="mb-2"><strong>Part 2 (In-Person Training) is priced separately</strong> and must be completed in person in the Houston area with Kairos Security. You'll pay for Part 2 at the time of your appointment.</p>
                      <p>After passing the online exam, you'll receive a link to schedule your in-person training via Calendly.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-7">
                    <AccordionTrigger>Where can I complete Part 2 in-person training for Level 3 and Level 4?</AccordionTrigger>
                    <AccordionContent>
                      Part 2 in-person training for Level 3 (Armed Security Officer) and Level 4 (Personal Protection Officer) is conducted in the <strong>Houston, Texas area</strong> by Kairos Security. After passing your online exam, you'll receive a Calendly link to schedule your appointment.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-8">
                    <AccordionTrigger>Will further certification help me earn more as a security officer?</AccordionTrigger>
                    <AccordionContent>
                      Yes. Certain roles require more advanced certification, especially duties where carrying a firearm or protecting an important person is required. Since these roles need specialist training, they receive higher pay.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-9">
                    <AccordionTrigger>What Does Level 2 Certification Mean for Your Security Career?</AccordionTrigger>
                    <AccordionContent>
                      It means you can be employed as a roving patrol or dedicated security guard anywhere in the state. Without the certificate you are legally barred from performing the functions of a security guard officer. If you carry out shift work without the proper certification, both you and your employer could face legal censure.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-10">
                    <AccordionTrigger>Does Where You Get Your Certification Matter?</AccordionTrigger>
                    <AccordionContent>
                      Yes. Not every security company has the same commitment to rigor as Kairos Security. Some companies are only interested in getting you through the program as quickly as possible to get you certified and on the streets, regardless of whether or not you understand the material. We will make sure you acquire all the skills you need to be an effective security guard.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-11">
                    <AccordionTrigger>Will I be able to keep the certification even if I don't stay to work with Kairos Security?</AccordionTrigger>
                    <AccordionContent>
                      Yes. The certifications offered in our courses are issued by the Texas Department of Public Safety and are valid for any security role in the State of Texas at any company.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cert-12">
                    <AccordionTrigger>How many times can I take the final exam?</AccordionTrigger>
                    <AccordionContent>
                      You have <strong>3 attempts</strong> to pass the final exam for each course. If you fail the exam 3 times, you will need to re-purchase the course to continue. We recommend thoroughly reviewing the course materials before each attempt to maximize your chances of passing. A score of 70% or higher is required to pass.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>

              <TabsContent value="career">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Will Kairos Security hire me after I qualify?</AccordionTrigger>
                    <AccordionContent>
                      Kairos Security is expanding rapidly and we have positions available for every level of certification we offer. Contact us to ask about opportunities in your area.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>Will the skills I learn training as a security guard help me find other work in different fields?</AccordionTrigger>
                    <AccordionContent>
                      Any professional training or qualification you take will teach you many transferable skills. Furthermore it demonstrates to a future employer that you are hard working and committed to completing what you set out to do, traits which are always in demand in any field.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>What kind of career advancement opportunities are available?</AccordionTrigger>
                    <AccordionContent>
                      With Kairos Security Academy training, you can advance from entry-level security positions to specialized roles including executive protection, event security, crisis intervention specialist, and security management positions. Our comprehensive training prepares you for career growth in the security industry.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>
        </section>


    </>);
}
