+++
title = "Math"
date = 2022-01-03
+++

Taken from [https://mathjax.github.io/MathJax-demos-web/tex-chtml.html](https://mathjax.github.io/MathJax-demos-web/tex-chtml.html)

# MathJax v3 beta: TeX input, HTML output test

When $a \ne 0$, there are two solutions to $ ax^2 + bx + c = 0 $ and they are
$$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$

## The Lorenz Equations

$$
\begin{align}
\dot{x} &amp; = \sigma(y-x) \\
\dot{y} &amp; = \rho x - y - xz \\
\dot{z} &amp; = -\beta z + xy
\end{align}
$$

## The Cauchy-Schwarz Inequality

$$
\left( \sum_{k=1}^n a_k b_k \right)^{\!\!2} \leq
\left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
$$

## A Cross Product Formula

$$
\mathbf{V}_1 \times \mathbf{V}_2 =
\begin{vmatrix}
\mathbf{i} &amp; \mathbf{j} &amp; \mathbf{k} \\
\frac{\partial X}{\partial u} &amp; \frac{\partial Y}{\partial u} &amp; 0 \\
\frac{\partial X}{\partial v} &amp; \frac{\partial Y}{\partial v} &amp; 0 \\
\end{vmatrix}
$$

## The probability of getting \(k\) heads when flipping \(n\) coins is:

$$
P(E) = {n \choose k} p^k (1-p)^{ n-k}
$$

## An Identity of Ramanujan

$$
\frac{1}{(\sqrt{\phi \sqrt{5}}-\phi) e^{\frac25 \pi}} =
    1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {1+\frac{e^{-6\pi}}
    {1+\frac{e^{-8\pi}} {1+\ldots} } } }
$$

## A Rogers-Ramanujan Identity

$$
1 +  \frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots =
    \prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})},
    \quad\quad \text{for $|q| &lt; 1$}.
$$

## Maxwell's Equations

$$
\begin{align}
    \nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &amp; = \frac{4\pi}{c}\vec{\mathbf{j}} \\
    \nabla \cdot \vec{\mathbf{E}} &amp; = 4 \pi \rho \\
    \nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} &amp; = \vec{\mathbf{0}} \\
    \nabla \cdot \vec{\mathbf{B}} &amp; = 0
\end{align}
$$

## In-line Mathematics

Finally, while display equations look good for a page of samples, the
ability to mix math and text in a paragraph is also important.  This
expression $\sqrt{3x-1}+(1+x)^2$ is an example of an inline equation.  As
you see, MathJax equations can be used this way as well, without unduly
disturbing the spacing between lines.