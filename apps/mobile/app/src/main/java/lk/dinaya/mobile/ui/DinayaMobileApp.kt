package lk.dinaya.mobile.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import lk.dinaya.mobile.R
import lk.dinaya.mobile.data.BookingSummary
import lk.dinaya.mobile.data.ModuleItem
import lk.dinaya.mobile.data.ModuleMetric
import lk.dinaya.mobile.data.StoredSession

private val BrandBlue = Color(0xFF2563EB)
private val BrandBlue700 = Color(0xFF1D4ED8)
private val BrandBlue50 = Color(0xFFDBEAFE)
private val BrandViolet = Color(0xFF7C3AED)
private val BrandAmber = Color(0xFFF59E0B)
private val BrandGreen = Color(0xFF16A34A)
private val WarmBackground = Color(0xFFF5F4F1)
private val PageBackground = Color(0xFFF8FAFC)
private val Slate900 = Color(0xFF0F172A)
private val Slate700 = Color(0xFF334155)
private val Slate600 = Color(0xFF475569)
private val Slate500 = Color(0xFF64748B)
private val Slate100 = Color(0xFFF1F5F9)
private val BorderMuted = Color(0xFFE5E7EB)

private val DinayaColors = lightColorScheme(
    primary = BrandBlue,
    onPrimary = Color.White,
    secondary = BrandViolet,
    tertiary = BrandAmber,
    background = WarmBackground,
    onBackground = Slate900,
    surface = Color.White,
    onSurface = Slate900,
    surfaceVariant = Slate100,
    onSurfaceVariant = Slate600,
    outline = BorderMuted,
)

private val CardShape = RoundedCornerShape(16.dp)
private val FieldShape = RoundedCornerShape(8.dp)
private val ButtonShape = RoundedCornerShape(8.dp)

@Composable
fun DinayaMobileApp(viewModel: DinayaViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    MaterialTheme(colorScheme = DinayaColors) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = if (state.session == null) WarmBackground else PageBackground,
        ) {
            if (state.session == null) {
                LoginScreen(state, viewModel)
            } else {
                DashboardScreen(state, viewModel)
            }
        }
    }
}

@Composable
private fun LoginScreen(state: DinayaUiState, viewModel: DinayaViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(WarmBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 30.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        BrandLockup(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        )
        Spacer(modifier = Modifier.height(26.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(18.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(BorderStroke(1.dp, Color.White), RoundedCornerShape(18.dp)),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Welcome back",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Slate900,
                    )
                    Text(
                        text = "Sign in to your dashboard",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate500,
                    )
                }

                DinayaTextField(
                    value = state.email,
                    onValueChange = viewModel::updateEmail,
                    label = "Email",
                    keyboardType = KeyboardType.Email,
                )
                DinayaTextField(
                    value = state.password,
                    onValueChange = viewModel::updatePassword,
                    label = "Password",
                    keyboardType = KeyboardType.Password,
                    isPassword = true,
                )
                DinayaTextField(
                    value = state.deviceName,
                    onValueChange = viewModel::updateDeviceName,
                    label = "Device name",
                )

                HorizontalDivider(color = BorderMuted)

                DinayaTextField(
                    value = state.baseUrl,
                    onValueChange = viewModel::updateBaseUrl,
                    label = "API URL",
                    compact = true,
                )

                ErrorText(state.errorMessage)

                Button(
                    onClick = viewModel::signIn,
                    enabled = !state.isLoading,
                    shape = ButtonShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandBlue,
                        contentColor = Color.White,
                        disabledContainerColor = Color(0xFF93C5FD),
                        disabledContentColor = Color.White.copy(alpha = 0.72f),
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = Color.White,
                            strokeWidth = 2.dp,
                        )
                    } else {
                        Text(
                            text = "Sign in",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }

                Text(
                    text = "Secure sign-in - Your data is encrypted",
                    style = MaterialTheme.typography.labelMedium,
                    color = Slate500,
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                )
            }
        }
    }
}

@Composable
private fun DashboardScreen(state: DinayaUiState, viewModel: DinayaViewModel) {
    val context = LocalContext.current
    val selectedSection = dashboardSectionByKey(state.selectedSectionKey)
    val selectedGroup = selectedSection.group
    val moduleState = state.moduleContent[selectedSection.key]

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        DashboardTopBar(onSignOut = viewModel::signOut)
        BusinessSummaryCard(state = state)
        DashboardGroupTabs(
            selectedGroup = selectedGroup,
            onSelectGroup = { group ->
                mobileDashboardSections.firstOrNull { it.group == group }?.let {
                    viewModel.selectSection(it.key)
                }
            },
        )
        DashboardSectionTabs(
            selectedGroup = selectedGroup,
            selectedSectionKey = selectedSection.key,
            onSelectSection = viewModel::selectSection,
        )

        ErrorText(state.errorMessage)

        if (selectedSection.key == "bookings") {
            BookingsWorkspace(
                section = selectedSection,
                state = state,
                onRefresh = viewModel::refreshSelectedSection,
                onOpenWeb = { openWebFallback(context, state.session, selectedSection.webPath) },
                onStatus = viewModel::updateBookingStatus,
            )
        } else {
            ModuleWorkspace(
                section = selectedSection,
                moduleState = moduleState,
                onRefresh = viewModel::refreshSelectedSection,
                onOpenWeb = {
                    openWebFallback(
                        context = context,
                        session = state.session,
                        path = moduleState?.payload?.webPath ?: selectedSection.webPath,
                    )
                },
            )
        }
    }
}

@Composable
private fun DashboardTopBar(onSignOut: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BrandLockup()
        TextButton(
            onClick = onSignOut,
            colors = ButtonDefaults.textButtonColors(contentColor = BrandBlue),
        ) {
            Text("Logout", fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun BusinessSummaryCard(state: DinayaUiState) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = CardShape,
        border = BorderStroke(1.dp, BorderMuted),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "Good day,",
                    style = MaterialTheme.typography.labelLarge,
                    color = Slate500,
                    fontWeight = FontWeight.Medium,
                )
                Text(
                    text = state.bootstrap?.business?.name
                        ?: state.session?.businessName
                        ?: "Dinaya dashboard",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Slate900,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = state.bootstrap?.business?.timezone ?: state.session?.userEmail.orEmpty(),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate500,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CompactSignal(
                    label = "Plan",
                    value = state.bootstrap?.business?.plan?.replaceFirstChar { it.uppercase() } ?: "Mobile",
                    tone = Color(0xFFD97706),
                    modifier = Modifier.weight(1f),
                )
                CompactSignal(
                    label = "Staff",
                    value = (state.bootstrap?.staff?.size ?: 0).toString(),
                    tone = BrandViolet,
                    modifier = Modifier.weight(1f),
                )
                CompactSignal(
                    label = "Today",
                    value = state.bookings.size.toString(),
                    tone = BrandBlue700,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun CompactSignal(
    label: String,
    value: String,
    tone: Color,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Slate100)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = Slate500,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            color = tone,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun DashboardGroupTabs(
    selectedGroup: MobileDashboardGroup,
    onSelectGroup: (MobileDashboardGroup) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        MobileDashboardGroup.entries.forEach { group ->
            val selected = group == selectedGroup
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (selected) Slate900 else Color.White)
                    .border(BorderStroke(1.dp, if (selected) Slate900 else BorderMuted), RoundedCornerShape(999.dp))
                    .clickable { onSelectGroup(group) }
                    .padding(horizontal = 14.dp, vertical = 9.dp),
            ) {
                Text(
                    text = group.label,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (selected) Color.White else Slate700,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun DashboardSectionTabs(
    selectedGroup: MobileDashboardGroup,
    selectedSectionKey: String,
    onSelectSection: (String) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        mobileDashboardSections
            .filter { it.group == selectedGroup }
            .forEach { section ->
                val selected = section.key == selectedSectionKey
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selected) BrandBlue50 else Color.White)
                        .border(
                            BorderStroke(1.dp, if (selected) Color(0xFFBFDBFE) else BorderMuted),
                            RoundedCornerShape(12.dp),
                        )
                        .clickable { onSelectSection(section.key) }
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                ) {
                    Text(
                        text = section.label,
                        style = MaterialTheme.typography.labelLarge,
                        color = if (selected) BrandBlue700 else Slate600,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                    )
                }
            }
    }
}

@Composable
private fun BookingsWorkspace(
    section: MobileDashboardSection,
    state: DinayaUiState,
    onRefresh: () -> Unit,
    onOpenWeb: () -> Unit,
    onStatus: (String, String) -> Unit,
) {
    WorkspaceHeader(
        title = section.label,
        summary = section.summary,
        onRefresh = onRefresh,
        onOpenWeb = onOpenWeb,
        isLoading = state.isLoading,
    )

    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        MetricCard(
            label = "Today",
            value = state.bookings.size.toString(),
            tone = MetricTone(BrandBlue50, BrandBlue700),
            modifier = Modifier.weight(1f),
        )
        MetricCard(
            label = "Staff",
            value = (state.bootstrap?.staff?.size ?: 0).toString(),
            tone = MetricTone(Color(0xFFEDE9FE), BrandViolet),
            modifier = Modifier.weight(1f),
        )
    }

    if (state.isLoading) {
        LoadingPanel()
    }

    if (state.bookings.isEmpty() && !state.isLoading) {
        EmptyState(
            title = "No bookings today",
            body = "New bookings will appear here when they are synced.",
        )
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            state.bookings.forEach { booking ->
                BookingCard(
                    booking = booking,
                    onStatus = { status -> onStatus(booking.id, status) },
                )
            }
        }
    }

    state.lastSyncedAt?.let {
        Text(
            text = "Synced ${it.take(16).replace("T", " ")}",
            style = MaterialTheme.typography.labelMedium,
            color = Slate500,
            modifier = Modifier.padding(bottom = 8.dp),
        )
    }
}

@Composable
private fun ModuleWorkspace(
    section: MobileDashboardSection,
    moduleState: ModuleContentState?,
    onRefresh: () -> Unit,
    onOpenWeb: () -> Unit,
) {
    val payload = moduleState?.payload
    WorkspaceHeader(
        title = payload?.title ?: section.label,
        summary = payload?.summary?.ifBlank { section.summary } ?: section.summary,
        onRefresh = onRefresh,
        onOpenWeb = onOpenWeb,
        isLoading = moduleState?.isLoading == true,
    )

    if (moduleState?.errorMessage != null) {
        ErrorText(moduleState.errorMessage)
    }

    if (moduleState?.isLoading == true && payload == null) {
        LoadingPanel()
        return
    }

    if (payload == null) {
        EmptyState(
            title = "Open ${section.label}",
            body = "Tap refresh to load the native ${section.label.lowercase()} workspace.",
        )
        return
    }

    if (payload.metrics.isNotEmpty()) {
        ModuleMetricsGrid(payload.metrics)
    }

    if (payload.items.isEmpty()) {
        EmptyState(
            title = payload.emptyState,
            body = "Use the web dashboard for setup and advanced edits.",
        )
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            payload.items.forEach { item ->
                ModuleItemCard(item)
            }
        }
    }

    if (payload.refreshedAt.isNotBlank()) {
        Text(
            text = "Refreshed ${payload.refreshedAt.take(16).replace("T", " ")}",
            style = MaterialTheme.typography.labelMedium,
            color = Slate500,
            modifier = Modifier.padding(bottom = 8.dp),
        )
    }
}

@Composable
private fun WorkspaceHeader(
    title: String,
    summary: String,
    onRefresh: () -> Unit,
    onOpenWeb: () -> Unit,
    isLoading: Boolean,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = CardShape,
        border = BorderStroke(1.dp, BorderMuted),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = Slate900,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = summary,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate500,
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = onRefresh,
                    enabled = !isLoading,
                    shape = ButtonShape,
                    border = BorderStroke(1.dp, BorderMuted),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandBlue),
                    modifier = Modifier.weight(1f),
                ) {
                    Text("Refresh", fontWeight = FontWeight.SemiBold)
                }
                OutlinedButton(
                    onClick = onOpenWeb,
                    shape = ButtonShape,
                    border = BorderStroke(1.dp, BorderMuted),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate700),
                    modifier = Modifier.weight(1f),
                ) {
                    Text("Open web", fontWeight = FontWeight.SemiBold, maxLines = 1)
                }
            }
        }
    }
}

@Composable
private fun ModuleMetricsGrid(metrics: List<ModuleMetric>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        metrics.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                row.forEach { metric ->
                    MetricCard(
                        label = metric.label,
                        value = metric.value,
                        tone = toneForMetric(metric.tone),
                        modifier = Modifier.weight(1f),
                    )
                }
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun ModuleItemCard(item: ModuleItem) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = CardShape,
        border = BorderStroke(1.dp, BorderMuted),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.Top,
        ) {
            ClientInitials(name = item.title)
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top,
                ) {
                    Text(
                        text = item.title.ifBlank { "Untitled" },
                        style = MaterialTheme.typography.titleMedium,
                        color = Slate900,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    item.status?.takeIf { it.isNotBlank() }?.let {
                        Spacer(modifier = Modifier.width(8.dp))
                        StatusPill(it)
                    }
                }
                item.subtitle?.takeIf { it.isNotBlank() }?.let {
                    Text(
                        text = it,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate600,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                item.meta?.takeIf { it.isNotBlank() }?.let {
                    Text(
                        text = it.take(16).replace("T", " "),
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate500,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}

@Composable
private fun LoadingPanel() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(28.dp),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(30.dp),
            color = BrandBlue,
            strokeWidth = 3.dp,
        )
    }
}

private fun toneForMetric(tone: String?): MetricTone {
    return when (tone) {
        "amber" -> MetricTone(Color(0xFFFEF3C7), Color(0xFFD97706))
        "cobalt" -> MetricTone(BrandBlue50, BrandBlue700)
        "emerald" -> MetricTone(Color(0xFFDCFCE7), BrandGreen)
        else -> MetricTone(Slate100, Slate700)
    }
}

private fun openWebFallback(context: Context, session: StoredSession?, path: String) {
    val base = session?.baseUrl?.trim()?.trimEnd('/').orEmpty().ifBlank { "https://dinaya-lk.vercel.app" }
    val normalizedPath = if (path.startsWith("/")) path else "/$path"
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("$base$normalizedPath"))
    context.startActivity(intent)
}

private data class MetricTone(
    val background: Color,
    val foreground: Color,
)

@Composable
private fun MetricCard(
    label: String,
    value: String,
    tone: MetricTone,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = CardShape,
        border = BorderStroke(1.dp, BorderMuted),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(tone.foreground),
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = Slate500,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = tone.foreground,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun BookingCard(booking: BookingSummary, onStatus: (String) -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = CardShape,
        border = BorderStroke(1.dp, BorderMuted),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ClientInitials(name = booking.clientName)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = booking.clientName.ifBlank { "Walk-in client" },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Slate900,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Text(
                            text = booking.serviceName,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate600,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                StatusPill(booking.status)
            }

            Text(
                text = "${booking.startsAt.take(16).replace("T", " ")} - ${booking.staffName}",
                style = MaterialTheme.typography.bodySmall,
                color = Slate500,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )

            BookingActions(status = booking.status, onStatus = onStatus)
        }
    }
}

@Composable
private fun ClientInitials(name: String) {
    val initials = name.trim()
        .split(" ")
        .filter { it.isNotBlank() }
        .take(2)
        .joinToString("") { it.first().uppercase() }
        .ifBlank { "D" }

    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(BrandBlue50),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = initials,
            style = MaterialTheme.typography.labelLarge,
            color = BrandBlue700,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun BookingActions(status: String, onStatus: (String) -> Unit) {
    val actions = when (status) {
        "pending" -> listOf("confirmed" to "Confirm", "cancelled" to "Cancel")
        "confirmed" -> listOf("completed" to "Complete", "no_show" to "No-show")
        else -> emptyList()
    }
    if (actions.isEmpty()) return

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        actions.forEach { (nextStatus, label) ->
            OutlinedButton(
                onClick = { onStatus(nextStatus) },
                shape = ButtonShape,
                border = BorderStroke(1.dp, BorderMuted),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandBlue),
                modifier = Modifier
                    .weight(1f)
                    .height(42.dp),
            ) {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                )
            }
        }
    }
}

@Composable
private fun StatusPill(status: String) {
    val colors = when (status) {
        "confirmed" -> Color(0xFFDCFCE7) to Color(0xFF166534)
        "pending" -> Color(0xFFFEF3C7) to Color(0xFF92400E)
        "cancelled" -> Color(0xFFFEE2E2) to Color(0xFF991B1B)
        "completed" -> Color(0xFFDBEAFE) to Color(0xFF1E40AF)
        "no_show" -> Color(0xFFEDE9FE) to Color(0xFF6D28D9)
        else -> Color(0xFFE2E8F0) to Slate700
    }
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(colors.first)
            .padding(horizontal = 10.dp, vertical = 5.dp),
    ) {
        Text(
            text = status.replace("_", " "),
            style = MaterialTheme.typography.labelSmall,
            color = colors.second,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
    }
}

@Composable
private fun EmptyState(title: String, body: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = CardShape,
        border = BorderStroke(1.dp, BorderMuted),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Slate900,
            )
            Text(
                text = body,
                style = MaterialTheme.typography.bodyMedium,
                color = Slate500,
            )
        }
    }
}

@Composable
private fun ErrorText(message: String?) {
    if (message.isNullOrBlank()) return
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFFFFF1F2))
            .border(BorderStroke(1.dp, Color(0xFFFECACA)), RoundedCornerShape(12.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
    ) {
        Text(
            text = message,
            color = Color(0xFFB91C1C),
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
        )
    }
}

@Composable
private fun DinayaTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
    compact: Boolean = false,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        shape = FieldShape,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = BrandBlue,
            unfocusedBorderColor = BorderMuted,
            focusedLabelColor = BrandBlue,
            unfocusedLabelColor = Slate500,
            cursorColor = BrandBlue,
            focusedContainerColor = Color.White,
            unfocusedContainerColor = Color.White,
        ),
        textStyle = MaterialTheme.typography.bodyMedium.copy(color = Slate900),
        modifier = Modifier
            .fillMaxWidth()
            .height(if (compact) 58.dp else 64.dp),
    )
}

@Composable
private fun BrandLockup(
    modifier: Modifier = Modifier,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.spacedBy(10.dp),
) {
    Row(
        modifier = modifier,
        horizontalArrangement = horizontalArrangement,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color.White,
                            Color(0xFFEFF6FF),
                        ),
                    ),
                )
                .border(BorderStroke(1.dp, Color(0xFFBFDBFE)), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painter = painterResource(id = R.drawable.ic_dinaya_mark),
                contentDescription = null,
                tint = BrandBlue,
                modifier = Modifier.size(25.dp),
            )
        }
        Text(
            text = "Dinaya.lk",
            style = MaterialTheme.typography.titleLarge,
            color = Slate900,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
    }
}
