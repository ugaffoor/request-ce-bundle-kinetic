<%@page pageEncoding="UTF-8" contentType="text/html" trimDirectiveWhitespaces="true"%>
<%@include file="../bundle/initialization.jspf" %>
<bundle:layout page="${bundle.path}/layouts/layout.jsp">
    <bundle:variable name="head">
        <c:set var="accessType" value="getAccessAdults" scope="request"/>
        <c:set var="pageName" value="Testimonials" scope="request"/>
        <title>${i18n.translate("Testimonials")} | ${space.getAttributeValue('School Name')}</title>
        <c:set var="metaDescriptions" value="${AdminHelper.getSEOMetaDescription()}" />
        <c:forEach items="${metaDescriptions}" var="description">
          <c:if test = "${description.pageName == 'Testimonials'}">
            <meta name="keywords" content="${description.keywords}">
            <meta name="description" content="${description.content}" />
          </c:if>
        </c:forEach>
        <c:set var="pageTitles" value="${AdminHelper.getPageTitles()}" />
        <c:forEach items="${pageTitles}" var="pageInfo">
          <c:if test = "${pageInfo.pageName == 'Testimonials'}">
            <c:set var="pageTitle" value="${pageInfo.pageTitle}"/>
            <c:set var="pageDescription" value="${pageInfo.pageDescription}" />
          </c:if>
        </c:forEach>
    </bundle:variable>
    <div class="content-container">
      <div class="content-detail detailBackground">
        <div class="">
          <section class="secondary-title">
            <h1>${pageTitle}</h1><br>
            <span>${pageDescription}</span>
          </section>
        </div>
        <div class="testimonials-wrapper">
            <section class="testimonials">
                <h2>${i18n.translate("Read Our Gracie Barra's Testimonials")}</h2>
                <p>Click on the pictures and read more.</p>
                <ul class="testimonials-ul">
                    <c:set var="testimonials" value="${AdminHelper.getTestimonials()}" />
                    <c:forEach items="${testimonials}" var="testimonial">
                        <li class="testimonials-li">
                            <div class="testimony">
                                <div class="image">
                                    <img alt="${testimonial.name} image" src="${testimonial.imageURL}">
                                </div>
                                <div class="info">
                                    <p><strong>${testimonial.name}</strong><br>
                                    <span style="font-size: 1rem;">${testimonial.slogan}</span></p>
                                </div>
                            </div>
                            <div class="testimonyPopup">
                                <i class="fa fa-close popupClose"></i>
                                <div class="arrows">
                                    <i class="fa fa-chevron-left left"></i>
                                    <i class="fa fa-chevron-right right"></i>
                                </div>
                                <p class="">
                                    <img src="${testimonial.imageURL}" alt="" class="secondary__img">
                                </p>
                                <p>
                                    <strong>${testimonial.name}</strong><br>
                                    <span style="font-size: 1rem;">${testimonial.slogan}</span>
                                </p>
                                <c:if test = "${not empty testimonial.slogan2}">
                                    <h2 style="color: #fff;">${testimonial.slogan2}</h2>
                                </c:if>
                                <c:if test = "${not empty testimonial.testimonial}">
                                    <p>
                                        ${testimonial.testimonial}
                                    </p>
                                </c:if>
                                <c:if test = "${not empty testimonial.statement}">
                                    <p>
                                        <strong>${testimonial.statement}</strong>
                                    </p>
                                </c:if>
                            </div>
                        </li>
                    </c:forEach>
                </ul>
            </section>
        </div>
      </div>
    </div>
</bundle:layout>
<script>
    $(".testimonials-li").click(function(){
       $(this).find(".testimonyPopup").addClass("visible");
    });
    $(".testimonials-li .popupClose").click(function(){
       $(this).parents(".testimonyPopup").removeClass("visible");
        event.stopPropagation();
    });

    $('.testimonyPopup .left').click(function () {
        curr=$(this).parents(".testimonials-li")
        prev=$(curr).prev();
        if (prev.length===0){
            prev=$(this).parents(".testimonials-li").siblings()[$(this).parents(".testimonials-li").siblings().length-1]
        }
        $(this).parents(".testimonyPopup").removeClass("visible");

        $(prev).find(".testimonyPopup").addClass("visible");
        event.stopPropagation();
    });
    $('.testimonyPopup .right').click(function () {
        curr=$(this).parents(".testimonials-li")
        next=$(curr).next();
        if (next.length===0){
            next=$(this).parents(".testimonials-li").siblings()[0];
        }
        $(this).parents(".testimonyPopup").removeClass("visible");

        $(next).find(".testimonyPopup").addClass("visible");
        event.stopPropagation();
    });

</script>
